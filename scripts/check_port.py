import httpx

for p in [3000, 3001, 5173]:
    try:
        r = httpx.get(f"http://localhost:{p}", timeout=2.0)
        has_vite = "vite" in r.text.lower() or "spacecare" in r.text.lower()
        print(f"Port {p}: status={r.status_code}, contains_vite_app={has_vite}")
    except Exception as e:
        print(f"Port {p}: error={e}")
