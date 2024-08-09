# DoReMi
## About
DoReMi is a music box controller connected to a p5.js web app for audio visualization and generative art, featuring music based on "Nangs" by Tame Impala, with audio from reverbmachine.com

<img src="readmeimgs\controller.jpg"></img> 

## DoReMi Overview
DoReMi has a slide potentiometer that switches between drum and bass modes - left for bass, right for drums. It also has three panel-mount potentiometers that control backing tracks, chord mode, and the volume of drums and bass. There are three keys for drum (snare, kick, hi-hat) and bass (82.41Hz, 98.00Hz, 110.00Hz) modes. It connects to an Arduino Leonardo via USB.

### Design Process: Designing & 3D printing Lid
<img src="readmeimgs\dp2.png" width="80%"></img> 

### Design Process: Final Circuitry
<img src="readmeimgs\dp3.png" width="80%"></img> 

## P5.js Web App Overview
On the landing screen, Bezier curves are sketched as the web app prompts the user to initiate the serial connection dialog and establish a connection. As new layers of the track play, the track name displays on the web app, and a flower grows longer.

<img src="readmeimgs\webapp_3.gif" width="40%"></img> 
<img src="readmeimgs\webapp_4.gif" width="40%"></img> 

Waveforms are generated from the sounds of the bass and drums. The higher the volume, the more higher the waveform reaches. Volume also affects the flower’s bold-ness. Pressing three keys will reset the canvas. The sound being played is also displayed. Drums and bass both controlled by 3 keys, to switch between the two, you have to slide a potentiometer all the way left or right

<img src="readmeimgs\webapp_1.gif" width="40%"></img> 
<img src="readmeimgs\webapp_2.gif" width="40%"></img> 

In Chord mode, the line extends to the edge of the screen. You can activate the volume to generate waveforms, and by moving the controller in any direction, you can paint these lines across the web page. The controller uses an accelerometer to achieve this effect.

<img src="readmeimgs\webapp_5.png" width="40%"></img> 
<img src="readmeimgs\webapp_6.png" width="40%"></img> 

## Inspiration for DoReMi
I was inspired by MIDI controllers and drum pads with pre-built sounds. I decided to make my controller have sounds and chords relating to ["Nangs" by Tame Impala](https://youtu.be/c3yEjD_oijw?feature=shared) – I chose this song because I was messing around with the Sound library in p5.js and the Oscillator waveforms and synthy tech sounds inspired me.


To do this, I used web serial communications to map different sounds to the controls of my controller. The different sounds it has are: bass, drums, synth chords, and pre-loaded backing tracks. 
- For the drums, I downloaded this free [“Lo-fi Psych Drums!” pack from PastToFutureSamples](https://pasttofuturesamples.gumroad.com/l/jxlln?layout=profile). I then mapped the kick, hi-hat, and snare to the three buttons I had on my controller. 
- For the "Nangs" backing tracks, I downloaded the audio files from [Reverbmachine’s blog](https://reverbmachine.com/blog/tame-impala-synth-sounds/), which deconstructed both the synth sounds and the production techniques. I mapped all the layers to a potentiometer, so as you turn it all the way, all layers of the song come together. 
- For the bass and chords, I used the p5.js sound library. 
- The bass and drum sounds in my controller share the same keys, so to switch between them, you have to slide the potentiometer all the way left or right.

I was also inspired by audio reactive visuals, 3D space, and Bezier Curves (Perlin Noise)
- The two videos I took the most inspiration from to design my web app are
    - Patt Vira’s [p5.js Coding Tutorial | Bezier Curves (Perlin Noise)](https://youtu.be/uctX1P3H3xM?feature=shared)
    - Kazuki Umeda’s [Make Beautiful 3D Flowers in p5.js: 1/2 ](https://youtu.be/8fgJ6i96fTY?feature=shared)

In addition to mapping the controls to different sounds, I also integrated them with the shapes and visuals on the web app. 
- At the bottom, there's a waveform that reacts to the sounds produced by pressing buttons and playing backing tracks/chords. The volume knob controls the sound output, affecting the waveform's responsiveness when turned off. 
- One potentiometer enables the sequential playback of backing tracks, gradually unveiling the layers while simultaneously expanding a flower shape in the web app. 
- Another potentiometer adjusts the progression through the song's chords, altering the spacing of the flower petals. 
- Inside the controller, an accelerometer influences the direction of drawn bezier curves and adjusts the positioning of visuals. This allows the controller to kind of act as a paintbrush.
- As bezier curves are drawn, the canvas fills accordingly. Clicking all three keys clears the canvas, allowing for a fresh start.

