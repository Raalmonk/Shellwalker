import subprocess, json, tempfile, os, traceback, uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List

# 🌟 挂载专属报告目录，提供原汁原味的 HTML 官方战报直达
os.makedirs("reports", exist_ok=True)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/reports", StaticFiles(directory="reports"), name="reports")

ACTION_MAP = {
    "TP": "tiger_palm", "BoK": "blackout_kick", "RSK": "rising_sun_kick",
    "FoF": "fists_of_fury", "SCK": "spinning_crane_kick", "SotWL": "strike_of_the_windlord",
    "WDP": "whirling_dragon_punch", "Xuen": "invoke_xuen_the_white_tiger", "ToD": "touch_of_death"
}
REVERSE_MAP = {v: k for k, v in ACTION_MAP.items()}

class ActionItem(BaseModel):
    spellId: str
    calledBuff: bool = False

class SimulateRequest(BaseModel):
    profileText: str
    sequence: List[ActionItem]
    autoPilot: bool = False

def safe_get(obj, *keys):
    for k in keys:
        if isinstance(obj, dict): obj = obj.get(k)
        elif isinstance(obj, list) and isinstance(k, int):
            if 0 <= k < len(obj): obj = obj[k]
            else: return None
        else: return None
    return obj

@app.post("/simulate")
def simulate_timeline(req: SimulateRequest):
    sim_id = uuid.uuid4().hex[:8]
    fd, simc_path = tempfile.mkstemp(suffix=".simc")
    os.close(fd)
    
    json_path = simc_path.replace(".simc", ".json").replace("\\", "/")
    html_name = f"report_{sim_id}.html"
    html_path = os.path.join("reports", html_name).replace("\\", "/")

    try:
        ui_sequence = [i.spellId for i in req.sequence if i.spellId in ACTION_MAP]
        simc_actions = [ACTION_MAP[i] for i in ui_sequence]
        seq_string = ":".join(simc_actions)

        out_lines = []
        if req.autoPilot:
            injected = False
            seq_action = f"actions+=/strict_sequence,name=mvp_seq:{seq_string}" if seq_string else ""
            for line in req.profileText.split('\n'):
                if not injected and seq_action and (line.strip().startswith("actions+=/call_action_list") or line.strip().startswith("actions+=/run_action_list")):
                    out_lines.append(seq_action)
                    injected = True
                out_lines.append(line)
            if not injected and seq_action: out_lines.append(seq_action)
        else:
            # 🛑 杀毒模式：如果没有开自动推演，物理拔掉 AI 的主板，杜绝“业报”乱入！
            for line in req.profileText.split('\n'):
                line_strip = line.strip()
                if line_strip.startswith("actions=") or (line_strip.startswith("actions+=") and not line_strip.startswith("actions.precombat+=")):
                    continue
                out_lines.append(line)
            
            if seq_string:
                out_lines.append(f"actions=strict_sequence,name=mvp_seq:{seq_string}")
                out_lines.append("actions+=/wait,sec=120") 
            else:
                out_lines.append("actions=wait,sec=120")

        # 🌟 听从你的铁律：deterministic=1 坚决保留！彻底抹杀随机触发！
        script = "\n".join(out_lines) + f"""
iterations=1
target_error=0
deterministic=1
max_time=120
report_details=1
json2="{json_path}"
html="{html_path}"
"""     
        with open(simc_path, "w", encoding="utf-8") as f: f.write(script)

        simc_exec = "simc.exe" if os.name == "nt" else "./simc"
        subprocess.run([simc_exec, simc_path], check=True, capture_output=True, text=True, encoding='utf-8', errors='replace')

        with open(json_path, "r", encoding="utf-8") as f: 
            player = safe_get(json.load(f), "sim", "players", 0) or {}

        active_talents = []
        talents_data = safe_get(player, "talents")
        if isinstance(talents_data, list):
            for t in talents_data:
                if isinstance(t, dict) and isinstance(t.get("name"), str): active_talents.append(t["name"].lower().replace(" ", "_"))
                elif isinstance(t, str): active_talents.append(t.lower().replace(" ", "_"))

        action_sequence = safe_get(player, "collected_data", "action_sequence") or []
        events = []
        seq_idx = 0

        if isinstance(action_sequence, list):
            for act in action_sequence:
                if not isinstance(act, dict): continue
                simc_name = act.get("name")
                t = act.get("time")
                if not isinstance(simc_name, str) or not isinstance(t, (int, float)): continue

                simc_name_lower = simc_name.lower()
                # 🔪 剔除满屏平砍垃圾
                if "melee" in simc_name_lower or "auto_attack" in simc_name_lower: continue

                is_ai = False
                called_buff = False
                
                # 🌟 智能破译：把底层智障的 strict_sequence 替换回你真真实实点下去的 UI 图标！
                if "strict_sequence" in simc_name_lower or "sequence" in simc_name_lower or "mvp_seq" in simc_name_lower:
                    if seq_idx < len(ui_sequence):
                        ui_id = ui_sequence[seq_idx]
                        called_buff = req.sequence[seq_idx].calledBuff
                        seq_idx += 1
                    else:
                        ui_id = "unknown_seq"
                else:
                    ui_id = REVERSE_MAP.get(simc_name, simc_name)
                    is_ai = True

                # 🌟 提取施法瞬间绝对快照：真实气与能量！
                chi = safe_get(act, "resources", "chi")
                if chi is None: chi = act.get("chi", 0)
                energy = safe_get(act, "resources", "energy")
                if energy is None: energy = act.get("energy", 0)

                events.append({
                    "spellId": ui_id, "startT": t, "chi": chi, "energy": energy, 
                    "isAI": is_ai, "rawName": simc_name, "calledBuff": called_buff
                })

        timeline = []
        # 🌟 核心修复：精准计算 GCD 与等待的缝隙。法术自身直接占据 1s 的宽度，绝不重叠！
        for i in range(len(events)):
            curr = events[i]
            next_start = events[i+1]["startT"] if i+1 < len(events) else curr["startT"] + 1.0
            
            if curr["spellId"] == "FoF": max_dur = 3.5
            elif curr["spellId"] == "SCK": max_dur = 1.5
            else: max_dur = 1.0
            
            actual_dur = min(max_dur, next_start - curr["startT"])
            
            timeline.append({
                "type": "CAST", "spellId": curr["spellId"], "startT": curr["startT"],
                "duration": actual_dur, "chi": curr["chi"], "energy": curr["energy"],
                "isAI": curr["isAI"], "rawName": curr["rawName"], "calledBuff": curr["calledBuff"]
            })
            
            gap = next_start - (curr["startT"] + actual_dur)
            if gap > 0.05:
                timeline.append({"type": "WAIT", "startT": curr["startT"] + actual_dur, "duration": gap})

        # 🌟 真正有意义的数据：抛弃总伤，唯有 DPS 永恒！
        dps = safe_get(player, "collected_data", "dps", "mean") or 0.0
        
        # 🌟 核心防吞噬检举：如果底层打出来的数量小于你的意图数量，必定是缺气死锁！
        dropped_count = max(0, len(ui_sequence) - seq_idx)

        return {
            "dps": dps, 
            "timeline": timeline, 
            "activeTalents": active_talents, 
            "droppedCount": dropped_count,
            "executedCount": seq_idx,
            "htmlReportUrl": f"http://localhost:8000/reports/{html_name}" # 🌟 HTML战报地址！
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))