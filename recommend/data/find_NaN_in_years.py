import pandas as pd

# Замените 'your_dataset.csv' на путь к вашему файлу
df = pd.read_csv('movies_with_year.csv')

# Находим строки, где year - это NaN
nan_year_rows = df[df['year'].isna()]

# Выводим эти строки
print(nan_year_rows)

# Если нужно узнать индексы строк с NaN в year:
print("Индексы строк с NaN в year:", nan_year_rows.index.tolist())
