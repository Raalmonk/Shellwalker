import subprocess
import re
import json

def fetch_full_class_data(simc_path="./simc", wow_class="monk"):
    print(f"🚀 正在全自动抓取 [{wow_class.upper()}] 的底层数据...")

    # 1. 抓取该职业的【全量技能】
    print("正在查询所有职业法术...")
    spell_cmd = [simc_path, f"spell_query=class_spell.class={wow_class}"]
    spell_output = subprocess.run(spell_cmd, capture_output=True, text=True, encoding='utf-8').stdout
    
    # 2. 抓取该职业的【全量天赋】
    print("正在查询所有天赋...")
    talent_cmd = [simc_path, f"spell_query=talent.class={wow_class}"]
    talent_output = subprocess.run(talent_cmd, capture_output=True, text=True, encoding='utf-8').stdout

    return {
        "spells": parse_simc_blocks(spell_output, is_talent=False),
        "talents": parse_simc_blocks(talent_output, is_talent=True)
    }

def parse_simc_blocks(raw_text, is_talent=False):
    """使用正则按块切分，一次性解析几百个技能/天赋"""
    # 按照 "Name :", "Spell :" 或 "Talent :" 拆分成独立的文本块
    blocks = re.split(r'\n(?=(?:Name|Spell|Talent)\s*:)', "\n" + raw_text)
    
    results = {}
    for block in blocks:
        if not block.strip(): continue
        
        # 提取名字和 ID
        match_name = re.search(r'(?:Name|Spell|Talent)\s*:\s*(.+?)\s*\(id=(\d+)\)', block)
        if not match_name: continue
        
        name = match_name.group(1).strip()
        obj_id = int(match_name.group(2))
        
        # 智能过滤：排轴器时间轴上不需要拖拽“纯被动光环”和“底层触发器”
        if not is_talent:
            if "Passive" in block or "Trigger" in name or "Visual" in name:
                continue
            
        # 初始化基础数据
        data = {
            "id": obj_id, 
            "name": name, 
            "gcd": 1.5, 
            "cast_time": 0.0, 
            "cooldown": 0.0, 
            "resource": "None"
        }

        # 提取专精 (例如 Spec : Windwalker)
        spec_match = re.search(r'Spec\s*:\s*(.+)', block)
        if spec_match: data["spec"] = spec_match.group(1).strip()

        # 提取战斗属性
        gcd_match = re.search(r'GCD\s*:\s*([\d\.]+) seconds', block)
        if gcd_match: data["gcd"] = float(gcd_match.group(1))
        
        cast_match = re.search(r'Cast Time\s*:\s*([\d\.]+) seconds', block)
        if cast_match: data["cast_time"] = float(cast_match.group(1))
        data["is_channeled"] = "Channeled" in block
        
        cd_match = re.search(r'Cooldown\s*:\s*([\d\.]+) seconds', block)
        if cd_match: data["cooldown"] = float(cd_match.group(1))
        
        res_match = re.search(r'Resource\s*:\s*(.+)', block)
        if res_match: data["resource"] = res_match.group(1).strip()

        # 以 ID 为键存入字典，前端可 O(1) 秒查
        results[obj_id] = data
        
    return results

if __name__ == "__main__":
    SIMC_EXECUTABLE = "./simc" # Windows 环境请改为 "./simc.exe"
    CLASS_NAME = "monk"        # 以后想抓法师，直接换成 "mage"
    
    db = fetch_full_class_data(SIMC_EXECUTABLE, CLASS_NAME)
    
    # 保存全量数据库
    with open(f"{CLASS_NAME}_database.json", "w", encoding="utf-8") as f:
        json.dump(db, f, indent=4, ensure_ascii=False)
        
    print(f"✅ 完成！自动剔除废案后，共提取了 {len(db['spells'])} 个主动技能，以及 {len(db['talents'])} 个天赋。")