import _ from 'lodash';
import './style.css';
import Icon from './icon.png';
import Data from './data.xml';
import printMe from './print';
import { cube } from './math';

if (process.env.NODE_ENV != 'production') {
    console.log("Looks like we are in development mode.");
}

function component() {
    var element = document.createElement('div');
    var btn = document.createElement('button');

    // lodash, imported by this script
    element.innerText = _.join(['Hello', 'webpack', '5 cuebed is ' + cube(5)], "\n");

    element.classList.add('hello');
    var myIcon = new Image();
    myIcon.src = Icon;

    element.appendChild(myIcon);

    console.log(JSON.stringify(Data));

    btn.innerText = 'Click me and check the console';
    btn.onclick = printMe;

    element.appendChild(btn);

    return element;
}

document.body.appendChild(component());