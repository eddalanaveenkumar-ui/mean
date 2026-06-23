with open("src/components/TeacherClassroom/index.jsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "system" in line.lower() or "prompt" in line.lower():
            if "role:" in line or "content:" in line or "const" in line:
                print(f"{i}: {line.strip()}")
