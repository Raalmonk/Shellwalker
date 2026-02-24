import subprocess, json, tempfile, os, traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

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
    fd, simc_path = tempfile.mkstemp(suffix=".simc")
    os.close(fd)
    json_path = simc_path.replace(".simc", ".json").replace("\\", "/")

    try:
        simc_actions = [ACTION_MAP[i.spellId] for i in req.sequence if i.spellId in ACTION_MAP]
        seq_string = ":".join(simc_actions)

        out_lines = []
        injected = False
        seq_action = f"actions+=/strict_sequence,name=mvp_seq:{seq_string}" if seq_string else "actions+=/wait,sec=1"
        halt_action = "actions+=/wait,sec=120"

        for line in req.profileText.split('\n'):
            if not injected and (line.strip().startswith("actions+=/call_action_list") or line.strip().startswith("actions+=/run_action_list")):
                out_lines.append(seq_action)
                if not req.autoPilot: out_lines.append(halt_action)
                injected = True
            out_lines.append(line)

        if not injected:
            out_lines = []
            for line in req.profileText.split('\n'):
                out_lines.append(line)
                if not injected and line.strip().startswith("actions="):
                    out_lines.append(seq_action)
                    if not req.autoPilot: out_lines.append(halt_action)
                    injected = True

        script = "\n".join(out_lines) + f"""
iterations=1
target_error=0
deterministic=1
max_time=120
report_details=1
json2="{json_path}"
"""
        with open(simc_path, "w", encoding="utf-8") as f: f.write(script)

        simc_exec = "simc.exe" if os.name == "nt" else "./simc"
        try:
            subprocess.run([simc_exec, simc_path], check=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else e.stdout
            raise Exception(f"SimC 解析崩溃:\n{error_msg}")

        with open(json_path, "r", encoding="utf-8") as f: 
            json_data = json.load(f)

        player = safe_get(json_data, "sim", "players", 0) or {}

        active_talents = []
        talents_data = safe_get(player, "talents")
        if isinstance(talents_data, list):
            for t in talents_data:
                if isinstance(t, dict) and isinstance(t.get("name"), str): active_talents.append(t["name"].lower().replace(" ", "_"))
                elif isinstance(t, str): active_talents.append(t.lower().replace(" ", "_"))

        profile_lower = req.profileText.lower()
        if "strike_of_the_windlord" in profile_lower: active_talents.append("strike_of_the_windlord")
        if "whirling_dragon_punch" in profile_lower: active_talents.append("whirling_dragon_punch")

        action_sequence = safe_get(player, "collected_data", "action_sequence") or []
        timeline, last_t = [], 0.0

        # 🌟 核心破译：记录你排版了哪些技能，随时准备替换底层假名
        ui_sequence = [i.spellId for i in req.sequence]
        seq_idx = 0

        if isinstance(action_sequence, list):
            for act in action_sequence:
                if not isinstance(act, dict): continue
                simc_name = act.get("name")
                t = act.get("time")
                if not isinstance(simc_name, str) or not isinstance(t, (int, float)): continue

                simc_name_lower = simc_name.lower()
                
                # 剔除无用的平砍垃圾，保持时间轴清爽
                if "melee" in simc_name_lower or "auto_attack" in simc_name_lower:
                    continue

                is_ai = False
                # 🌟 智能破译：遇到 strict_sequence 的障眼法，直接拿你排入的真名替换！
                if "strict_sequence" in simc_name_lower or "sequence" in simc_name_lower or "mvp_seq" in simc_name_lower:
                    if seq_idx < len(ui_sequence):
                        ui_id = ui_sequence[seq_idx]
                        seq_idx += 1
                    else:
                        ui_id = "unknown_seq"
                else:
                    ui_id = REVERSE_MAP.get(simc_name, simc_name)
                    is_ai = True

                # 🌟 抽取资源：抓取每一个动作出手瞬间的真实气/能量！
                chi = safe_get(act, "resources", "chi")
                if chi is None: chi = act.get("chi", 0)
                energy = safe_get(act, "resources", "energy")
                if energy is None: energy = act.get("energy", 0)

                gap = t - last_t
                if gap > 0.05: timeline.append({"type": "WAIT", "startT": last_t, "duration": gap})
                timeline.append({
                    "type": "CAST", "spellId": ui_id, "startT": t, "duration": 1.0,
                    "chi": chi, "energy": energy, "isAI": is_ai
                })
                last_t = t

        for i in range(len(timeline)):
            if timeline[i]["type"] == "CAST":
                timeline[i]["duration"] = (timeline[i+1]["startT"] - timeline[i]["startT"]) if i + 1 < len(timeline) else 1.5

        # 🌟 PRD 核心要求：用 DPS (秒伤) 替换毫无意义的总伤！
        dps = safe_get(player, "collected_data", "dps", "mean")
        if not isinstance(dps, (int, float)): dps = 0.0

        return {"dps": dps, "timeline": timeline, "activeTalents": active_talents}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(simc_path): os.remove(simc_path)
        if os.path.exists(json_path): os.remove(json_path)