import os

query = "MeanClassroom"
exclude_dirs = [".git", "node_modules", "dist", ".venv", ".idea"]

found_lines = []
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        if file.endswith((".js", ".jsx", ".ts", ".tsx", ".css", ".html")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for i, line in enumerate(f, 1):
                        if query in line:
                            found_lines.append(f"{path}:{i}: {line.strip()}")
            except Exception:
                pass

print(f"Found {len(found_lines)} occurrences:")
for fl in found_lines:
    print(fl)
