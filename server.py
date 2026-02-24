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
    autoPilot: bool = False  # 🌟 完美支持残局自动推演

# 🛡️ 终极防弹解析器：无论 SimC 格式怎么乱变，绝不报 str object 错误！
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

        # 🧠 外科手术式注入：保留原生 APL 大脑！精准插入你的排轴意图！
        out_lines = []
        injected = False
        seq_action = f"actions+=/strict_sequence,name=mvp_seq:{seq_string}" if seq_string else "actions+=/wait,sec=1"
        halt_action = "actions+=/wait,sec=120"

        for line in req.profileText.split('\n'):
            if not injected and (line.strip().startswith("actions+=/call_action_list") or line.strip().startswith("actions+=/run_action_list")):
                out_lines.append(seq_action)
                if not req.autoPilot: out_lines.append(halt_action) # 若不开自动驾驶，打完意图就锁死时间
                injected = True
            out_lines.append(line)

        # 兜底注入
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
            raise Exception(f"SimC 执行崩溃:\n{error_msg}")

        with open(json_path, "r", encoding="utf-8") as f: 
            json_data = json.load(f)

        player = safe_get(json_data, "sim", "players", 0) or {}

        # 🛡️ 安全提取天赋 (💥 解决 'str' object 报错的第一防线)
        active_talents = []
        talents_data = safe_get(player, "talents")
        if isinstance(talents_data, list):
            for t in talents_data:
                if isinstance(t, dict) and isinstance(t.get("name"), str):
                    active_talents.append(t["name"].lower().replace(" ", "_"))
                elif isinstance(t, str):
                    active_talents.append(t.lower().replace(" ", "_"))
        elif isinstance(talents_data, dict):
            for k in talents_data.keys():
                if isinstance(k, str):
                    active_talents.append(k.lower().replace(" ", "_"))

        profile_lower = req.profileText.lower()
        if "strike_of_the_windlord" in profile_lower: active_talents.append("strike_of_the_windlord")
        if "whirling_dragon_punch" in profile_lower: active_talents.append("whirling_dragon_punch")

        # 🛡️ 安全提取动作序列 (💥 解决 'str' object 报错的核心地带)
        action_sequence = safe_get(player, "collected_data", "action_sequence") or []
        timeline, last_t = [], 0.0

        if isinstance(action_sequence, list):
            for act in action_sequence:
                # 🛡️ 致命防御盾牌：如果 act 是一段文字（如 "combat_end"），直接跳过不调用 get()！
                if not isinstance(act, dict): 
                    continue
                    
                simc_name = act.get("name")
                t = act.get("time")
                if not isinstance(simc_name, str) or not isinstance(t, (int, float)): 
                    continue

                # 若是未知动作(如 AI 自动驾驶打出的药水)，直接展示原名！
                ui_id = REVERSE_MAP.get(simc_name, simc_name) 

                gap = t - last_t
                if gap > 0.05: timeline.append({"type": "WAIT", "startT": last_t, "duration": gap})
                timeline.append({"type": "CAST", "spellId": ui_id, "startT": t, "duration": 1.0})
                last_t = t

        for i in range(len(timeline)):
            if timeline[i]["type"] == "CAST":
                timeline[i]["duration"] = (timeline[i+1]["startT"] - timeline[i]["startT"]) if i + 1 < len(timeline) else 1.5

        # 🛡️ 安全提取伤害明细
        total_dmg = safe_get(player, "collected_data", "dmg", "mean")
        if not isinstance(total_dmg, (int, float)): total_dmg = 0.0
        
        spell_breakdown = {}
        stats = safe_get(player, "stats")
        if isinstance(stats, list):
            for stat in stats:
                if not isinstance(stat, dict): continue
                name = stat.get("name")
                dmg = stat.get("portion_amount", 0)
                count = stat.get("execute_count", 0)
                if isinstance(name, str) and (dmg > 0 or count > 0):
                    ui_id = REVERSE_MAP.get(name, name)
                    spell_breakdown[ui_id] = {"damage": dmg, "count": count}

        return {"totalDamage": total_dmg, "timeline": timeline, "activeTalents": active_talents, "spellBreakdown": spell_breakdown}

    except Exception as e:
        tb = traceback.format_exc()
        print(f"Server Error Log:\n{tb}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(simc_path): os.remove(simc_path)
        if os.path.exists(json_path): os.remove(json_path)