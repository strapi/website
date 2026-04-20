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
        "fields[0]": "slug",
        "fields[1]": "title",
        "fields[2]": "description",
        "fields[3]": "publishedAt",
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

with_desc = []
empty_desc = []
null_desc = []
for item in all_items:
    attrs = item.get("attributes", {})
    desc = attrs.get("description")
    entry = {
        "id": item["id"],
        "slug": attrs.get("slug"),
        "title": attrs.get("title"),
        "description": desc,
        "publishedAt": attrs.get("publishedAt"),
    }
    if desc is None:
        null_desc.append(entry)
    elif desc.strip() == "":
        empty_desc.append(entry)
    else:
        with_desc.append(entry)

print(f"\nTotal posts:       {total}")
print(f"Populated:         {len(with_desc)} ({100*len(with_desc)/total:.1f}%)")
print(f"Empty string:      {len(empty_desc)} ({100*len(empty_desc)/total:.1f}%)")
print(f"Null/missing:      {len(null_desc)} ({100*len(null_desc)/total:.1f}%)")

if with_desc:
    lengths = sorted(len(p["description"]) for p in with_desc)
    print(f"\nDescription length — min {lengths[0]}, median {lengths[len(lengths)//2]}, max {lengths[-1]}")
    print(f"\nSample (first 10 populated):")
    for p in with_desc[:10]:
        d = p["description"].replace("\n", " ")
        if len(d) > 140:
            d = d[:140] + "…"
        print(f"  /{p['slug']}")
        print(f"    → {d}")

os.makedirs("reports", exist_ok=True)
with open("reports/posts-description.json", "w") as f:
    json.dump({
        "totals": {
            "total": total,
            "populated": len(with_desc),
            "empty": len(empty_desc),
            "null": len(null_desc),
        },
        "populated": with_desc,
    }, f, indent=2)
print("\nSaved: reports/posts-description.json")
