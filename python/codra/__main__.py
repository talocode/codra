import argparse
import json
import sys
from .client import CodraClient, CodraError


def main():
    parser = argparse.ArgumentParser(prog="codra", description="AI coding agent API client")
    parser.add_argument("--version", action="version", version="0.1.0")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("health", help="Check API health")

    p = sub.add_parser("repo-summary", help="Summarize a repository")
    p.add_argument("--files", required=True, help="JSON array of {path, content} objects")

    p = sub.add_parser("explain", help="Explain code")
    p.add_argument("--language", required=True, help="Programming language")
    p.add_argument("--code", required=True, help="Code to explain")

    p = sub.add_parser("review", help="Review code")
    p.add_argument("--language", required=True, help="Programming language")
    p.add_argument("--code", required=True, help="Code to review")

    p = sub.add_parser("plan", help="Plan implementation")
    p.add_argument("--task", required=True, help="Task description")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    client = CodraClient()

    try:
        if args.command == "health":
            result = client.health()
        elif args.command == "repo-summary":
            files = json.loads(args.files)
            result = client.repo_summary(files)
        elif args.command == "explain":
            result = client.explain(args.language, args.code)
        elif args.command == "review":
            result = client.review(args.language, args.code)
        elif args.command == "plan":
            result = client.plan(args.task)
        else:
            print(f"Unknown command: {args.command}", file=sys.stderr)
            sys.exit(1)
        print(json.dumps(result, indent=2))
    except CodraError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
