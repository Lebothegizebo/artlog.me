def generate_entry(date: str, title: str, titlecolor:str, usercolor:str, entrycolor: str, datecolor: str, text: str):
    # 1. Print formatted JSON object
    print("\n" + "=" * 50)
    print("--- COPY THIS BLOCK DIRECTLY INTO YOUR diary.json ---")
    print("=" * 50)
    print("{")
    print(f'        "date": "{date}",')
    print(f'        "title": "{title}",')    
    print(f'        "isTitleEncrypted": false,')
    print(f'        "userColor": "{usercolor}",')
    print(f'        "titleColor": "{titlecolor}",')
    print(f'        "dateColor": "{datecolor}",')
    print(f'        "entryColor": "{entrycolor}",')
    print(f'        "isEncrypted": false,')
    print(f'        "content": "{text}"')
    print("    }")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    print("--- SYSTEM DIARY LOG UTILITY ---")
    entry_date = input("Enter Date (e.g., 21-07-2026): ").strip()
    entry_title = input("Enter Title: ").strip()
    entry_titlecolor = input("Enter Log Title Colour: (e.g., Red, Yellow, Green): ").strip()
    entry_usercolor = input("Enter User Colour (e.g., Blue, Purple):").strip()
    entry_datecolor = "#a8b2ff"
    entry_text = input("Enter Content: ").strip()

    generate_entry(
        date=entry_date,
        title=entry_title,
        titlecolor=entry_titlecolor,
        entrycolor=entry_titlecolor,
        usercolor=entry_usercolor,
        datecolor=entry_datecolor,
        text=entry_text,
    )