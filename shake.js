/*This code may not be distributed without express written/typed permission by Gopal Othayoth (cerebraldatabank@gmail.com).*/
/*This code was extracted from the GOGO CSS Class Library.*/
/*The GOGO CSS Class Library was made by Gopal Othayoth (cerebraldatabank@gmail.com). All rights reserved.*/
@keyframes crazy {
  0% {background: #FF0000; color: #0000FF; transform: rotateX(45deg) rotateY(45deg) rotateZ(45deg);}
  25% {background: #FFFF00; color: #FF0000; transform: rotateX(-45deg) rotateY(-45deg) rotate(-45deg);}
  50% {background: #FF00FF; color: #FFFF00; transform: rotateX(45deg) rotateY(45deg) rotate(45deg);}
  75% {background: #00FFFF; color: #FF00FF; transform: rotateX(-45deg) rotateY(-45deg) rotate(-45deg);}
  100% {background: #0000FF; color: #00FFFF; transform: rotateX(45deg) rotateY(45deg) rotate(45deg);}
}
@keyframes tridimensional {
  0% {transform: rotateX(10deg) rotateY(10deg) rotateZ(10deg);}
  25% {transform: rotateX(-10deg) rotateY(-10deg) rotate(-10deg);}
  50% {transform: rotateX(10deg) rotateY(10deg) rotate(10deg);}
  75% {transform: rotateX(-10deg) rotateY(-10deg) rotate(-10deg);}
  100% {transform: rotateX(10deg) rotateY(10deg) rotate(10deg);}
}
@keyframes floatingtext {
  0% {transform: rotateX(10deg) rotateY(10deg) rotateZ(10deg);}
  25% {transform: rotateX(-10deg) rotateY(-10deg) rotate(-10deg);}
  50% {transform: rotateX(10deg) rotateY(10deg) rotate(10deg);}
  75% {transform: rotateX(-10deg) rotateY(-10deg) rotate(-10deg);}
  100% {transform: rotateX(10deg) rotateY(10deg) rotate(10deg);}
}
@keyframes shaky {
  0% {transform: translate(5px, 0px);}
  25% {transform: translate(-5px, 5px);}
  50% {transform: translate(0px, -5px);}
  75% {transform: translate(-5px, 5px);}
  100% {transform: translate(5px, 5px);}
}
@keyframes spin {
  0% {transform: rotate(0deg);}
  100% {transform: rotate(360deg);}
}
@keyframes spin-backwards {
  0% {transform: rotate(360deg);}
  100% {transform: rotate(0deg);}
}
@keyframes rainbow {
  0% {color: #FF0000;}
  20% {color: #FFFF00;}
  40% {color: #00FF00;}
  60% {color: #00FFFF;}
  80% {color: #0000FF;}
  100% {color: #FF00FF;}
}
@keyframes hypnosis {
  0% {background: repeating-radial-gradient(circle, black, black 10px, white 10px, white 20px);}
  100% {background: repeating-radial-gradient(circle, white, white 10px, black 10px, black 20px);}
  /*100% {background: repeating-radial-gradient(circle, black, black 10px, white 10px, white 20px);}*/
}
@keyframes obfuscation {
  0% {content: "$";}
  25% {content: "@";}
  50% {content: "#";}
  75% {content: "&";}
  100% {content: "%";}
}
@keyframes altobfuscation {
  0% {content: "#";}
  25% {content: "%";}
  50% {content: "$";}
  75% {content: "@";}
  100% {content: "&";}
}
@keyframes highlight {
  0% {background: #FFA500;}
  100% {}
}
.gogo-shaky {
  animation: shaky 0.5s linear 0s infinite none running;
}
.gogo-floating-text {
  animation: floatingtext 20s linear 0s infinite alternate none running;
  text-shadow: 0px 4px 4px #333333;
}
.gogo-spin {
  animation: spin 10s linear 0s infinite normal none running;
}
.gogo-spin-fast {
  animation: spin 1s linear 0s infinite normal none running;
}
.gogo-spin-once {
  animation: spin 10s linear 0s 1 normal none running;
}
.gogo-spin-fast-once {
  animation: spin 1s linear 0s 1 normal none running;
}
.gogo-spin-backwards {
  animation: spin-backwards 10s linear 0s infinite normal none running;
}
.gogo-spin-backwards-fast {
  animation: spin-backwards 1s linear 0s infinite normal none running;
}
.gogo-spin-backwards-once {
  animation: spin-backwards 10s linear 0s 1 normal none running;
}
.gogo-spin-backwards-fast-once {
  animation: spin-backwards 1s linear 0s 1 normal none running;
}
.gogo-unselectable {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  -khtml-user-select: none;
  user-select: none;
}
.gogo-centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.gogo-obfuscated, .gogo-alt-obfuscated {
  font-family: "Consolas", monospace;
}
.gogo-obfuscated::after {
  animation: obfuscation 200ms linear 0s infinite normal none running;
}
.gogo-alt-obfuscated::after {
  animation: altobfuscation 200ms linear 0s infinite normal none running;
}
