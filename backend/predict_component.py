# predict_component.py
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import json

# Load model and labels (only once when imported)
model = load_model('component_classifier.h5')

class_labels = {
    0: "Bypass-capacitor",
    1: "Electrolytic-capacitor",
    2: "Integrated-micro-circuit",
    3: "LED",
    4: "PNP-transistor",
    5: "armature",
    6: "attenuator",
    7: "cartridge-fuse",
    8: "clip-lead",
    9: "electric-relay",
    10: "filament",
    11: "heat-sink",
    12: "images",
    13: "induction-coil",
    14: "jumper-cable",
    15: "junction-transistor",
    16: "light-circuit",
    17: "limiter-clipper",
    18: "local-oscillator",
    19: "memory-chip",
    20: "microchip",
    21: "microprocessor",
    22: "multiplexer",
    23: "omni-directional-antenna",
    24: "potential-divider",
    25: "potentiometer",
    26: "pulse-generator",
    27: "relay",
    28: "rheostat",
    29: "semi-conductor",
    30: "semiconductor-diode",
    31: "shunt",
    32: "solenoid",
    33: "stabilizer",
    34: "step-down-transformer",
    35: "step-up-transformer",
    36: "transistor"
}

# Dummy recycling guide (expand as needed)
recycling_guide = {
    "Bypass-capacitor": "Can be recycled at e-waste centers. May contain harmful materials—do not dispose in regular trash.",
    "Electrolytic-capacitor": "Contains electrolytes—handle carefully and recycle at specialized e-waste facilities.",
    "Integrated-micro-circuit": "Should be removed from circuit boards and sent to electronic recycling plants.",
    "LED": "Do not throw in trash. Recycle at e-waste facility. May contain small amounts of lead or arsenic.",
    "PNP-transistor": "Contains semiconductors. Recycle with other small electronics or at e-waste centers.",
    "armature": "Scrap metal content. Can be sold as scrap or recycled at metal/e-waste facilities.",
    "attenuator": "May contain resistive materials—send to e-waste recycling.",
    "cartridge-fuse": "Contains metal and glass. Can be recycled in specialized facilities.",
    "clip-lead": "Metal and rubber components—send to e-waste or reuse if intact.",
    "electric-relay": "May contain copper, silver, and plastics. Recycle responsibly.",
    "filament": "Typically found in bulbs—handle with care and dispose through lighting recycling.",
    "heat-sink": "Made of aluminum—valuable scrap metal. Can be recycled at metal yards.",
    "images": "Not a valid component. Please recheck image category.",
    "induction-coil": "Contains copper wire—remove and recycle.",
    "jumper-cable": "Reusable if intact. If not, recycle at electronics centers.",
    "junction-transistor": "Recycle with semiconductors. Do not dispose in general waste.",
    "light-circuit": "Usually part of PCB—entire board can be sent for recycling.",
    "limiter-clipper": "Part of circuit—recycle with PCB or e-waste.",
    "local-oscillator": "Complex component—send to recycling with boards or full devices.",
    "memory-chip": "Contains precious metals—always recycle at certified e-waste centers.",
    "microchip": "Same as memory chip—do not throw in trash.",
    "microprocessor": "Valuable for gold/copper recovery—recycle with professionals.",
    "multiplexer": "Electronic circuit part—dispose with e-waste.",
    "omni-directional-antenna": "Check for reusable condition. Recycle if broken.",
    "potential-divider": "Circuit element—recycle with PCB waste.",
    "potentiometer": "Can be reused. Else, dispose at e-waste facilities.",
    "pulse-generator": "Usually embedded in circuit—recycle whole board.",
    "relay": "Contains copper and metals—remove and recycle.",
    "rheostat": "Partially reusable. Otherwise, recycle as e-waste.",
    "semi-conductor": "Contains valuable materials—recycle at specialized centers.",
    "semiconductor-diode": "Small component—recycle as part of circuit boards.",
    "shunt": "Can be reused if intact. Recycle if damaged.",
    "solenoid": "Contains copper coils—recycle for metal recovery.",
    "stabilizer": "Contains multiple components. Dispose at e-waste collection points.",
    "step-down-transformer": "Heavy metal component—recycle for copper and iron.",
    "step-up-transformer": "Same as above—do not throw in trash.",
    "transistor": "Recycle with electronic components—never in regular trash."
}

def predict_image(img_path):
    try:
        img = image.load_img(img_path, target_size=(224, 224))  # Match model input
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0) / 255.0   # Shape becomes (1, 224, 224, 3)

     
        prediction = model.predict(img_array)
        print("Prediction raw output:", prediction)
        print("Shape of prediction:", prediction.shape)
        print("Labels:", class_labels)

        predicted_index = np.argmax(prediction)
        predicted_label = class_labels[predicted_index]
        confidence = float(prediction[0][predicted_index]) * 100

        return {
            "prediction": predicted_label,
            "confidence": round(confidence, 2),
            "recycling_guide": recycling_guide.get(predicted_label, "No guide available.")
        }

    except Exception as e:
        return {"error": str(e)}
