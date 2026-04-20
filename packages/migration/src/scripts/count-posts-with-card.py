import os
import json
import sys
import urllib.request
import urllib.parse

base = os.environ["SOURCE_URL"]
token = os.environ["SOURCE_TOKEN"]


def fetch(page):
    qs = urllib.parse.urlencode({
        "pagination[pageSize]": 100,
        "pagination[page]": page,
        "populate[card]": "true",
    })
    req = urllib.request.Request(
        f"{base}/api/blog-posts?{qs}",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


first = fetch(1)
total_pages = first["meta"]["pagination"]["pageCount"]
total = first["meta"]["pagination"]["total"]
print(f"Total posts: {total}, pages: {total_pages}", file=sys.stderr)

all_items = list(first["data"])
for p in range(2, total_pages + 1):
    data = fetch(p)
    all_items.extend(data["data"])
    print(f"fetched page {p}/{total_pages}", file=sys.stderr)

with_card = []
for item in all_items:
    attrs = item.get("attributes", {})
    card = attrs.get("card")
    if card:
        with_card.append({
            "id": item["id"],
            "slug": attrs.get("slug"),
            "title": attrs.get("title"),
            "publishedAt": attrs.get("publishedAt"),
            "card": card,
        })

print(f"\nTotal posts: {total}")
print(f"Posts with `card` populated: {len(with_card)}")
print(f"Percent: {100 * len(with_card) / total:.2f}%\n")

print("Sample (first 20):")
for p in with_card[:20]:
    slug = p["slug"]
    card_title = (p["card"] or {}).get("title") or ""
    print(f"  id={p['id']:<5} /{slug}  — card.title={card_title!r}")

if len(with_card) > 20:
    print(f"  ... and {len(with_card) - 20} more")

os.makedirs("reports", exist_ok=True)
with open("reports/posts-with-card.json", "w") as f:
    json.dump(with_card, f, indent=2)
print("\nSaved full list to: reports/posts-with-card.json")
