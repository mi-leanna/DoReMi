#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_LIS3DH.h>
#include <Adafruit_Sensor.h>

Adafruit_LIS3DH lis = Adafruit_LIS3DH(); // Accelerometer sensor object

const int kButtonPin1 = 5; // Pin for button 1
const int kButtonPin2 = 6; // Pin for button 2
const int kButtonPin3 = 9; // Pin for button 3

#define kPotPin A0        // Pin for the potentiometer
#define kPotVolPin A2     // Pin for the volume potentiometer
#define kPotZoomPin A4    // Pin for the zoom potentiometer
#define kSlidePot A1      // Pin for the slide potentiometer

bool button_state1 = false; // State of button 1
bool button_state2 = false; // State of button 2
bool button_state3 = false; // State of button 3

void SetupButtons(); // Function to setup button pins
void ReadButtonsAndSendState(); // Function to read button states and potentiometer values, then send over serial

void setup() {
  Serial.begin(115200); // Initialize serial communication
  if (!lis.begin(0x18)) { // Initialize accelerometer
    while (1); // Hang if initialization fails
  }
  lis.setRange(LIS3DH_RANGE_4_G); // Set accelerometer range to +/- 4g

  SetupButtons(); 
  pinMode(kPotPin, INPUT);    
  pinMode(kPotVolPin, INPUT);  
  pinMode(kPotZoomPin, INPUT); 
}

void loop() {
  ReadButtonsAndSendState(); // Read button states and potentiometer values, then send over serial
  delay(50); // Small delay to prevent continuous loop
}

void SetupButtons() {
  pinMode(kButtonPin1, INPUT_PULLUP);
  pinMode(kButtonPin2, INPUT_PULLUP);
  pinMode(kButtonPin3, INPUT_PULLUP);
}

void ReadButtonsAndSendState() {
  // Read button states
  bool new_state1 = digitalRead(kButtonPin1) == LOW;
  bool new_state2 = digitalRead(kButtonPin2) == LOW;
  bool new_state3 = digitalRead(kButtonPin3) == LOW;

  // Read potentiometer values
  int pot_value_A0 = analogRead(kPotPin);   
  int pot_value_A2 = analogRead(kPotVolPin); 
  int pot_value_A4 = analogRead(kPotZoomPin);
  int pot_value_A1 = analogRead(kSlidePot);  

  // Normalize potentiometer value
  float pot_value_as_float = pot_value_A4 / 1023.0;
  float desired_min = 0.0;
  float desired_max = 1.0;
  float range_length = desired_max - desired_min;
  
 // Map potentiometer values to desired ranges
  int mapped_value_A0 = map(pot_value_A0, 0, 1023, 40, 80);
  int mapped_value_A2 = map(pot_value_A2, 0, 1023, 1, 7);
  int mapped_value_A1 = map(pot_value_A1, 250, 1023, 1, 2);
  float mapped_value_A4 = pot_value_as_float * range_length + desired_min;

  // Read accelerometer data
  lis.read();
  int accel_X = lis.x;
  int accel_Y = lis.y;

  // Send data over serial only if button states have changed
  if (new_state1 != button_state1 || new_state2 != button_state2 || new_state3 != button_state3) {
    button_state1 = new_state1;
    button_state2 = new_state2;
    button_state3 = new_state3;

    // print data to Serial, which will then be parsed
    // in the p5.js web app
    Serial.print("[");
    Serial.print(button_state1 ? "1" : "0");
    Serial.print(",");
    Serial.print(button_state2 ? "1" : "0");
    Serial.print(",");
    Serial.print(button_state3 ? "1" : "0");
    Serial.print(",");
    Serial.print(mapped_value_A0); // Potentiometer value
    Serial.print(",");
    Serial.print(accel_X); // X accelerometer value
    Serial.print(",");
    Serial.print(accel_Y); // Y accelerometer value
    Serial.print(",");
    Serial.print(mapped_value_A2); // Volume potentiometer value
    Serial.print(",");
    Serial.print(mapped_value_A4); // Zoom potentiometer value
    Serial.print(",");
    Serial.print(mapped_value_A1); // Slide potentiometer value
    Serial.println("]");
  } else {
    Serial.print("[");
    Serial.print(button_state1 ? "1" : "0");
    Serial.print(",");
    Serial.print(button_state2 ? "1" : "0");
    Serial.print(",");
    Serial.print(button_state3 ? "1" : "0");
    Serial.print(",");
    Serial.print(mapped_value_A0); // Potentiometer value
    Serial.print(",");
    Serial.print(accel_X); // X accelerometer value
    Serial.print(",");
    Serial.print(accel_Y); // Y accelerometer value
    Serial.print(",");
    Serial.print(mapped_value_A2); // Volume potentiometer value
    Serial.print(",");
    Serial.print(mapped_value_A4); // Zoom potentiometer value
    Serial.print(",");
    Serial.print(mapped_value_A1); // Slide potentiometer value
    Serial.println("]");
  }
}
