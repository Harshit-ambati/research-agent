"""
SIH Agent Command Line Interface (CLI)
Interactive terminal interface to search, analyze, find research papers & patents,
and sync new problem statements.
"""
import sys
import argparse
import json
import io

# Ensure UTF-8 stdout/stderr on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from sih_agent_core import agent_core
from sih_updater import updater
from sih_vector_store import vector_store

def print_banner():
    print("=" * 70)
    print("  🚀 SIH TOPIC DISCOVERY & ADVISORY AGENT")
    print("  Vector DB • NLP Intent • Academic Papers • Google Patents")
    print("=" * 70)

def cmd_search(args):
    query = " ".join(args.query) if isinstance(args.query, list) else str(args.query)
    print(f"\n🔍 Processing query with NLP Engine: \"{query}\"...")
    
    result = agent_core.discover_topics(
        prompt=query,
        n_results=args.limit,
        year=args.year,
        category=args.category,
        domain=args.domain
    )
    
    nlp_info = result["nlp_analysis"]
    print(f"\n🧠 NLP Analysis:")
    print(f"  • Inferred Category: {nlp_info['inferred_category']}")
    print(f"  • Identified Domains: {', '.join(nlp_info['suggested_domains'])}")
    print(f"  • Extracted Entities: {', '.join(nlp_info['entities'][:6])}")
    print(f"  • Detected Tech: {', '.join(nlp_info['tech_stack']) if nlp_info['tech_stack'] else 'General'}")

    print(f"\n📋 Matched Topics ({result['total_matches']} results):")
    print("-" * 70)
    for i, topic in enumerate(result["topics"], 1):
        rel = topic.get("relevance_percentage", 80)
        print(f"[{i}] ⭐ {rel}% Match | {topic['id']} ({topic['year']}) | {topic['category']}")
        print(f"    Title: {topic['title']}")
        print(f"    Ministry/Org: {topic['organization']}")
        print(f"    Domain: {topic['domain']}")
        print(f"    Tech: {', '.join(topic.get('tech_keywords', []))}")
        print(f"    Why Matched: {topic.get('match_reason', '')}")
        print("-" * 70)

def cmd_analyze(args):
    ps_id = args.id
    print(f"\n🔬 Generating Deep Strategic Advisory for Problem Statement [{ps_id}]...")
    deep = agent_core.analyze_topic_deep(ps_id)
    if "error" in deep:
        print(f"❌ Error: {deep['error']}")
        return

    topic = deep["topic"]
    advisory = deep["advisory"]
    papers = deep["research_papers"]
    patents = deep["patents"]
    pitch = deep["pitch_outline"]

    print("\n" + "=" * 70)
    print(f"📌 {topic['id']} - {topic['title']}")
    print(f"   Domain: {topic['domain']} | Category: {topic['category']} | Year: {topic['year']}")
    print(f"   Organization: {topic['organization']}")
    print("=" * 70)

    print("\n💡 HACKATHON WINNING ADVISORY:")
    print(f"  • Match Rationale: {advisory['why_matched']}")
    print(f"  • Winning Edge: {advisory['winning_novelty_edge']}")
    print(f"  • MVP Feasibility: {advisory['estimated_mvp_readiness']}")

    print("\n🛠️ RECOMMENDED TECH STACK:")
    for k, v in advisory["recommended_tech_stack"].items():
        print(f"  • {k.replace('_', ' ').title()}: {v}")

    print("\n⏱️ 36-HOUR MVP ROADMAP:")
    for step in advisory["feasibility_roadmap"]:
        print(f"  • [{step['phase']}]: {step['milestone']}")

    print(f"\n📚 ACADEMIC RESEARCH PAPERS ({len(papers)} retrieved):")
    for p in papers:
        print(f"  • {p['title']} ({p['published_date']})")
        print(f"    Authors: {', '.join(p['authors'])}")
        print(f"    PDF Link: {p['pdf_url']}")
        print(f"    Application Note: {p['hackathon_takeaway']}")

    print(f"\n💡 GOOGLE PATENTS PRIOR-ART ({len(patents)} retrieved):")
    for pat in patents:
        print(f"  • [{pat['patent_id']}] {pat['title']} ({pat['year']})")
        print(f"    Assignee: {pat['assignee']}")
        print(f"    Patent Link: {pat['patent_url']}")
        print(f"    Novelty Strategy: {pat['novelty_advisory']}")

    print("\n📊 4-SLIDE PITCH BLUEPRINT:")
    for slide_key, slide in pitch.items():
        print(f"  ▶ {slide['title'].upper()}:")
        for b in slide["bullets"]:
            print(f"     - {b}")

def cmd_sync(args):
    print("\n🔄 Running live SIH sync & crawler...")
    res = updater.check_and_sync(vector_store=vector_store)
    print(f"\n✅ Sync Status: {res['status']}")
    print(f"  • Total problem statements in database: {res['total_count']}")
    print(f"  • Newly added statements: {res['new_added']}")
    print(f"  • Message: {res['message']}")

def cmd_stats(args):
    stats = vector_store.get_stats()
    print("\n📊 SIH DATABASE & VECTOR STORE METRICS:")
    print(f"  • Total Statements Indexed: {stats['total_statements']}")
    print(f"  • Persistent Vector Embeddings: {stats['vector_store_count']}")
    print(f"  • By Edition: {dict(stats['years'])}")
    print(f"  • By Category: {dict(stats['categories'])}")
    print("\n  • Top Domains:")
    for domain, count in stats["top_domains"][:8]:
        print(f"    - {domain}: {count}")

def cmd_interactive():
    print_banner()
    print("Type your project idea, keyword, or command ('help', 'stats', 'sync', 'exit').")
    while True:
        try:
            user_input = input("\n[SIH-Agent] > ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit", "q"]:
                print("Exiting SIH Agent. Best of luck with your hackathon!")
                break
            elif user_input.lower() == "help":
                print("Commands: search <query>, analyze <ps_id>, sync, stats, exit")
            elif user_input.lower() == "stats":
                cmd_stats(None)
            elif user_input.lower() == "sync":
                cmd_sync(None)
            elif user_input.lower().startswith("analyze "):
                ps_id = user_input.split(" ", 1)[1].strip()
                args = argparse.Namespace(id=ps_id)
                cmd_analyze(args)
            else:
                query = user_input
                if user_input.lower().startswith("search "):
                    query = user_input.split(" ", 1)[1].strip()
                args = argparse.Namespace(query=query, limit=5, year=None, category=None, domain=None)
                cmd_search(args)
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break

def main():
    parser = argparse.ArgumentParser(description="SIH Topic Discovery & Advisory Agent")
    subparsers = parser.add_subparsers(dest="command")

    # search
    p_search = subparsers.add_parser("search", help="Search problem statements")
    p_search.add_argument("query", nargs="+", help="Natural language query or keywords")
    p_search.add_argument("--limit", type=int, default=8, help="Number of results to return")
    p_search.add_argument("--year", type=int, default=None, help="Filter by edition year (e.g. 2025, 2024, 2023)")
    p_search.add_argument("--category", type=str, default=None, help="Filter by category (Software, Hardware)")
    p_search.add_argument("--domain", type=str, default=None, help="Filter by domain bucket")

    # analyze
    p_analyze = subparsers.add_parser("analyze", help="Deep analysis of a problem statement")
    p_analyze.add_argument("--id", required=True, help="Problem Statement ID (e.g. SIH26001, SIH2023_1204)")

    # sync
    subparsers.add_parser("sync", help="Check and sync new problem statements from live feeds")

    # stats
    subparsers.add_parser("stats", help="Show database & vector store metrics")

    # interactive
    subparsers.add_parser("interactive", help="Start interactive terminal mode")

    if len(sys.argv) == 1:
        cmd_interactive()
        return

    args = parser.parse_args()
    if args.command == "search":
        cmd_search(args)
    elif args.command == "analyze":
        cmd_analyze(args)
    elif args.command == "sync":
        cmd_sync(args)
    elif args.command == "stats":
        cmd_stats(args)
    elif args.command == "interactive":
        cmd_interactive()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
