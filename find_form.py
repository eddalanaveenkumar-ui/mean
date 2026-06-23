with open("src/components/TeacherClassroom/index.jsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "form" in line or "input" in line or "button" in line or "onSubmit" in line or "handleSubmit" in line:
            if i > 1500: # Usually the input form is at the bottom of the component
                print(f"{i}: {line.strip()}")
