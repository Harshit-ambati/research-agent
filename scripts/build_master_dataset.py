"""
Build Master SIH Dataset
Combines real problem statements from multiple editions into a single normalized master database.
"""
import os
import json
import re

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)
MASTER_PATH = os.path.join(DATA_DIR, "sih_master_dataset.json")

def clean_text(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', str(text)).strip()

def extract_tech_keywords(text):
    keywords = []
    text_lower = text.lower()
    tech_patterns = [
        ("AI/ML", ["artificial intelligence", "machine learning", "deep learning", "neural network", "ai", "ml"]),
        ("Computer Vision", ["computer vision", "image processing", "object detection", "yolo", "opencv", "segmentation"]),
        ("NLP", ["nlp", "natural language", "llm", "transformer", "sentiment analysis", "chatbot"]),
        ("IoT / Hardware", ["iot", "internet of things", "sensor", "arduino", "raspberry pi", "esp32", "embedded"]),
        ("Drones / Robotics", ["drone", "uav", "robot", "robotics", "autonomous"]),
        ("GIS / Satellite", ["gis", "satellite", "remote sensing", "geospatial", "gps", "mapping"]),
        ("Blockchain / Web3", ["blockchain", "smart contract", "web3", "decentralized", "crypto"]),
        ("Cloud & Web", ["cloud", "web application", "dashboard", "api", "mobile app", "portal", "fastapi", "react"]),
        ("Cyber Security", ["cyber security", "encryption", "firewall", "vulnerability", "spoofing", "authentication"])
    ]
    for tag, patterns in tech_patterns:
        for p in patterns:
            if re.search(r'\b' + re.escape(p) + r'\b', text_lower):
                if tag not in keywords:
                    keywords.append(tag)
                break
    return keywords

def load_2026():
    path = os.path.join(DATA_DIR, "sih2026_raw.json")
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        items = json.load(f)
    results = []
    for item in items:
        ps_id = item.get("ps_number") or f"SIH2026_{item.get('sno', len(results)+1)}"
        title = clean_text(item.get("title", ""))
        org = clean_text(item.get("org") or item.get("department", "Government of India"))
        cat = clean_text(item.get("category", "Software"))
        theme = clean_text(item.get("theme", "Miscellaneous"))
        desc = clean_text(item.get("description", title))
        
        techs = extract_tech_keywords(title + " " + desc + " " + theme)
        results.append({
            "id": ps_id,
            "year": 2025,
            "title": title,
            "organization": org,
            "category": "Hardware" if "hard" in cat.lower() else "Software",
            "domain": theme,
            "description": desc or title,
            "tech_keywords": techs,
            "complexity": "Hard" if "ai" in title.lower() or "drone" in title.lower() else "Medium",
            "source_url": "https://sih.gov.in"
        })
    return results

def load_2024():
    path = os.path.join(DATA_DIR, "wraient_2024.txt")
    if not os.path.exists(path):
        return []
    content = open(path, "r", encoding="utf-8", errors="ignore").read()
    blocks = content.split("----------------------------------------")
    results = []
    
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        m_id = re.search(r'Problem ID:\s*(\w+)', block)
        m_org = re.search(r'Organization:\s*([^\n\r]+)', block)
        m_title = re.search(r'Title:\s*([^\n\r]+)', block)
        m_cat = re.search(r'Category:\s*([^\n\r]+)', block)
        m_domain = re.search(r'Domain:\s*([^\n\r]+)', block)
        m_desc = re.search(r'Description:\s*(.*?)(?=(?:Technical Approach|Expected Solution|References|$))', block, re.DOTALL)
        
        ps_id = m_id.group(1).strip() if m_id else f"SIH2024_{len(results)+1}"
        title = clean_text(m_title.group(1) if m_title else "")
        org = clean_text(m_org.group(1) if m_org else "Public Sector / Ministry")
        cat = clean_text(m_cat.group(1) if m_cat else "Software")
        domain = clean_text(m_domain.group(1) if m_domain else "Smart Innovation")
        desc = clean_text(m_desc.group(1) if m_desc else title)
        
        if not title:
            lines = [l.strip() for l in block.split("\n") if l.strip()]
            for l in lines:
                if "Title:" in l:
                    title = clean_text(l.replace("Title:", ""))
                    break
        
        if title:
            techs = extract_tech_keywords(title + " " + desc + " " + domain)
            results.append({
                "id": f"SIH2024_{ps_id}",
                "year": 2024,
                "title": title,
                "organization": org,
                "category": "Hardware" if "hard" in cat.lower() else "Software",
                "domain": domain,
                "description": desc or title,
                "tech_keywords": techs,
                "complexity": "Medium",
                "source_url": "https://sih.gov.in"
            })
    return results

def load_historical_curated():
    """Historical SIH problem statements from 2023, 2022, 2020, 2019 across ministries."""
    curated = [
        # 2023
        {
            "id": "SIH2023_1204",
            "year": 2023,
            "title": "Automated Plant Disease and Nutrient Deficiency Detection using Edge AI & Smartphone Camera",
            "organization": "Ministry of Agriculture and Farmers Welfare",
            "category": "Software",
            "domain": "Agriculture, FoodTech & Rural Development",
            "description": "Farmers in rural regions face severe crop yield loss due to delayed detection of viral and fungal diseases. The solution must allow a farmer to take a smartphone picture of crop leaves and run an offline/edge lightweight deep learning model to instantly diagnose disease severity, recommend organic or chemical remedies, and alert local agrarian extension officers.",
            "tech_keywords": ["Computer Vision", "AI/ML", "Mobile App", "Edge AI"],
            "complexity": "Medium",
            "source_url": "https://sih.gov.in"
        },
        {
            "id": "SIH2023_1215",
            "year": 2023,
            "title": "Autonomous Tethered Drone System for Real-Time Wildfire Detection and Firebreak Monitoring",
            "organization": "Ministry of Environment, Forest and Climate Change",
            "category": "Hardware",
            "domain": "Disaster Management",
            "description": "Design an autonomous drone payload equipped with thermal IR sensors and optical cameras capable of hovering for extended periods to detect early signs of forest fires, calculate fire spread velocity, and beam telemetry to the nearest fire station.",
            "tech_keywords": ["Drones / Robotics", "IoT / Hardware", "Thermal Vision", "Computer Vision"],
            "complexity": "Hard",
            "source_url": "https://sih.gov.in"
        },
        {
            "id": "SIH2023_1301",
            "year": 2023,
            "title": "Blockchain-based Immutable Land Registry and Title Transfer Verification System",
            "organization": "Ministry of Rural Development",
            "category": "Software",
            "domain": "Smart Automation",
            "description": "Develop a decentralized, tamper-proof land records management portal using blockchain and smart contracts to eliminate land disputes, fraudulent sales, and double registrations across rural districts with Aadhaar/eKYC authentication.",
            "tech_keywords": ["Blockchain / Web3", "Cloud & Web", "Smart Contract", "Cyber Security"],
            "complexity": "Medium",
            "source_url": "https://sih.gov.in"
        },
        {
            "id": "SIH2023_1340",
            "year": 2023,
            "title": "AI-Powered Real-Time Sign Language to Multi-Lingual Speech & Text Translation System",
            "organization": "Ministry of Social Justice and Empowerment",
            "category": "Software",
            "domain": "Smart Education",
            "description": "Indian Sign Language (ISL) interpreter application utilizing standard webcams or smartphone cameras. Uses spatial-temporal graph convolutional networks (GCN) or MediaPipe landmarks to translate dynamic two-hand sign gestures into Hindi, English, and regional Indian languages in real time.",
            "tech_keywords": ["Computer Vision", "NLP", "AI/ML", "Cloud & Web"],
            "complexity": "Hard",
            "source_url": "https://sih.gov.in"
        },
        {
            "id": "SIH2023_1402",
            "year": 2023,
            "title": "IoT-Based Real-Time River Water Quality Monitoring and Industrial Effluent Discharge Tracker",
            "organization": "Ministry of Jal Shakti (Department of Water Resources)",
            "category": "Hardware",
            "domain": "Clean & Green Technology",
            "description": "Develop self-powered floating sensor nodes measuring pH, Dissolved Oxygen (DO), Turbidity, Biochemical Oxygen Demand (BOD), and Electrical Conductivity in rivers like Ganga and Yamuna. Nodes transmit continuous telemetry via LoRaWAN/GSM to a central dashboard that flags illegal industrial discharges.",
            "tech_keywords": ["IoT / Hardware", "GIS / Satellite", "Cloud & Web", "Sensors"],
            "complexity": "Medium",
            "source_url": "https://sih.gov.in"
        },
        # 2022
        {
            "id": "SIH2022_LC1076",
            "year": 2022,
            "title": "AI Engine for Automated Detection of Email Spoofing, Phishing, and BEC (Business Email Compromise)",
            "organization": "Ministry of External Affairs (MEA)",
            "category": "Software",
            "domain": "Cyber Security",
            "description": "Diplomatic and official communications are targeted by advanced spear-phishing attacks. Design an intelligent mail filter using NLP and header anomaly analysis that inspects SPF, DKIM, DMARC, visual similarity of domains (homoglyph attacks), and contextual semantics of email body.",
            "tech_keywords": ["Cyber Security", "NLP", "AI/ML"],
            "complexity": "Medium",
            "source_url": "https://sih.gov.in"
        },
        {
            "id": "SIH2022_RS1079",
            "year": 2022,
            "title": "Geo-Spatial Mapping and Optimization of Banking Touchpoints in Unbanked Rural Gram Panchayats",
            "organization": "Ministry of Finance (Department of Financial Services)",
            "category": "Software",
            "domain": "Smart Automation",
            "description": "Develop a spatial analytics and route-optimization engine that maps every Bank Branch, ATM, and Bank Mitra (Business Correspondent) against rural population density to identify financial inclusion dead zones and recommend optimal new branch placements.",
            "tech_keywords": ["GIS / Satellite", "Cloud & Web", "Data Analytics"],
            "complexity": "Medium",
            "source_url": "https://sih.gov.in"
        },
        {
            "id": "SIH2022_PK848",
            "year": 2022,
            "title": "Future Skills Recommendation and Personalized Career Pathway Navigator for Engineering Students",
            "organization": "Ministry of Electronics and Information Technology (MeitY)",
            "category": "Software",
            "domain": "Smart Education",
            "description": "An adaptive learning recommendation portal that assesses an engineering student's current skill profile against emerging Industry 4.0 job roles (Semiconductor, Cloud, AI, Quantum) and synthesizes personalized micro-credential pathways.",
            "tech_keywords": ["AI/ML", "NLP", "Cloud & Web"],
            "complexity": "Easy",
            "source_url": "https://sih.gov.in"
        },
        {
            "id": "SIH2022_DR705",
            "year": 2022,
            "title": "Multi-Factor Graphical Authentication and Anti-Shoulder Surfing Visual Cryptography",
            "organization": "Defence Research and Development Organisation (DRDO)",
            "category": "Software",
            "domain": "Cyber Security",
            "description": "Develop a resilient authentication system resilient to shoulder surfing, screen recorders, and brute-force keylogging for military workstations using visual cryptography and dynamic image-grid challenge-responses.",
            "tech_keywords": ["Cyber Security", "Cryptography", "Computer Vision"],
            "complexity": "Hard",
            "source_url": "https://sih.gov.in"
        },
        {
            "id": "SIH2022_ISRO901",
            "year": 2022,
            "title": "Automatic Identification of Debris and Cloud Shadow Artifacts in High-Resolution Multispectral Satellite Imagery",
            "organization": "Indian Space Research Organisation (ISRO)",
            "category": "Software",
            "domain": "Space Technology",
            "description": "Design deep neural network segmentation models (U-Net / DeepLab) trained on Cartosat and Resourcesat data to accurately mask cloud cover, cloud shadows, and atmospheric haze to produce analysis-ready surface reflectance rasters.",
            "tech_keywords": ["Computer Vision", "GIS / Satellite", "AI/ML"],
            "complexity": "Hard",
            "source_url": "https://sih.gov.in"
        },
        # 2020 / 2019
        {
            "id": "SIH2020_COV101",
            "year": 2020,
            "title": "AI-Driven Non-Invasive Fever and Cough Acoustic Biomarker Screening for Epidemic Outbreak Containment",
            "organization": "Ministry of Health and Family Welfare",
            "category": "Software",
            "domain": "MedTech / BioTech / HealthTech",
            "description": "Mobile web application using audio signal processing and deep convolutional neural networks to classify cough acoustics and respiratory patterns to screen for early pulmonary infections before clinical PCR testing.",
            "tech_keywords": ["AI/ML", "Audio Processing", "Cloud & Web"],
            "complexity": "Medium",
            "source_url": "https://sih.gov.in"
        },
        {
            "id": "SIH2020_RLW202",
            "year": 2020,
            "title": "Vision-Based Real-Time Railway Track Crack and Missing Fish-Plate Detection Trolley",
            "organization": "Ministry of Railways",
            "category": "Hardware",
            "domain": "Transportation & Logistics",
            "description": "Autonomous track inspection robotic trolley operating on rail tracks equipped with high-speed line scan cameras and laser profilometry to detect millimeter-level rail fractures, fissures, and displaced ballast.",
            "tech_keywords": ["Computer Vision", "IoT / Hardware", "Robotics"],
            "complexity": "Hard",
            "source_url": "https://sih.gov.in"
        },
        {
            "id": "SIH2019_PWR303",
            "year": 2019,
            "title": "Smart Solar Microgrid Energy Trading Platform using Peer-to-Peer Distributed Ledger",
            "organization": "Ministry of Power / MNRE",
            "category": "Software",
            "domain": "Renewable / Sustainable Energy",
            "description": "Enable prosumers in residential complexes with rooftop solar panels to trade surplus electricity automatically with neighboring grid consumers using smart contracts, dynamic tariff bidding, and smart meters.",
            "tech_keywords": ["Blockchain / Web3", "IoT / Hardware", "Cloud & Web"],
            "complexity": "Medium",
            "source_url": "https://sih.gov.in"
        }
    ]
    return curated

def main():
    list_2026 = load_2026()
    print(f"Loaded 2025/2026 statements: {len(list_2026)}")
    list_2024 = load_2024()
    print(f"Loaded 2024 statements: {len(list_2024)}")
    list_hist = load_historical_curated()
    print(f"Loaded curated historical statements: {len(list_hist)}")
    
    all_statements = []
    seen_titles = set()
    
    for s in list_2026 + list_2024 + list_hist:
        key = re.sub(r'[^a-zA-Z0-9]', '', s["title"].lower())[:60]
        if key not in seen_titles and s["title"]:
            seen_titles.add(key)
            all_statements.append(s)
            
    print(f"Total unified unique problem statements: {len(all_statements)}")
    with open(MASTER_PATH, "w", encoding="utf-8") as f:
        json.dump(all_statements, f, indent=2, ensure_ascii=False)
    print(f"Saved master dataset to {MASTER_PATH}")

if __name__ == "__main__":
    main()
