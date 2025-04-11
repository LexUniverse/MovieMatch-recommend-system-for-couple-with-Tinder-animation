import pandas as pd
import numpy as np
from sklearn.decomposition import NMF
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import joblib

# Загрузка подготовленных данных
ratings_matrix = pd.read_csv('processed_ratings_matrix.csv', index_col=0)

# Преобразуйте матрицу в numpy-массив
data = ratings_matrix.values

# Разделите данные на обучающую и тестовую выборки
train_data_array, test_data_array = train_test_split(data, test_size=0.2, random_state=42)

# Обучение модели NMF с увеличением max_iter
model = NMF(n_components=50, init='random', max_iter=1000, random_state=42)
user_features = model.fit_transform(train_data_array)

# Восстановление матрицы рейтингов
item_features = model.components_
predicted_ratings = np.dot(user_features, item_features)

# Поскольку размеры могут не совпадать, вычисляем RMSE для каждого пользователя отдельно
rmse_values = []
for i in range(test_data_array.shape[0]):
    user_test = test_data_array[i]
    user_pred = predicted_ratings[i]

    # Создание маски для реальных оценок
    mask = user_test > 0

    # Вычисление RMSE для текущего пользователя
    if np.any(mask):
        rmse = np.sqrt(mean_squared_error(user_test[mask], user_pred[mask]))
        rmse_values.append(rmse)

# Среднее значение RMSE по всем пользователям
if rmse_values:
    avg_rmse = np.mean(rmse_values)
    print(f'Среднее RMSE: {avg_rmse:.3f}')
else:
    print('Нет реальных оценок для вычисления RMSE')

# Сохраните модель
joblib.dump(model, 'nmf_model.pkl')
