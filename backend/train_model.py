import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
import os

# Define dataset path
dataset_path = r"C:\Users\HP\DebugNChillFinal\DebugNChill\backend\processed_images"

# Data augmentation & normalization
train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
    rescale=1./255,
    rotation_range=30,     # Rotate images randomly
    width_shift_range=0.2, # Shift images horizontally
    height_shift_range=0.2,# Shift images vertically
    horizontal_flip=True,  # Flip images horizontally
    validation_split=0.2   # 80% training, 20% validation
)

train_generator = train_datagen.flow_from_directory(
    dataset_path,
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    subset='training'
)

val_generator = train_datagen.flow_from_directory(
    dataset_path,
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    subset='validation'
)

# Improved CNN model
model = Sequential([
    Conv2D(64, (3,3), activation='relu', input_shape=(224, 224, 3)),
    MaxPooling2D(2,2),
    
    Conv2D(128, (3,3), activation='relu'),
    MaxPooling2D(2,2),
    
    Conv2D(256, (3,3), activation='relu'),
    MaxPooling2D(2,2),
    
    Flatten(),
    Dense(256, activation='relu'),
    Dropout(0.5),  # Prevent overfitting
    Dense(len(train_generator.class_indices), activation='softmax')  
])

# Compile with better optimizer
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
              loss='categorical_crossentropy',
              metrics=['accuracy'])

# Train the model for 30 epochs instead of 10
model.fit(train_generator,
          validation_data=val_generator,
          epochs=30)

# Save the model
model.save("component_classifier.h5")
print("Model training complete! Saved as component_classifier.h5")
