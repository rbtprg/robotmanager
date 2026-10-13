function run()

{


let zx = parseFloat(document.getElementById("x").value);
let zy = parseFloat(document.getElementById("y").value);
let zz = parseFloat(document.getElementById("z").value);
let zo = parseFloat(document.getElementById("o").value);


let zxm = Math.abs(zx);
let zzm = Math.abs(zz);





if (zx < 0 ){
  zccc =  (0.707 * zo) + (zxm)   ;
  zcvx = ( zccc * -1)
  zcc = zcvx.toFixed(3) ;
}


else{
    let zccc = zxm - (0.707 * zo) ;
    zcc = zccc.toFixed(3) ;
}




let zvv = zy ;

let zb = 0.707 * zo ; 
let zbv = zb + zzm


if (zz < 0 ){
    zbbb = zbv * -1 ;
    zbb = zbbb.toFixed(3) ;
 }
 else{
     zbb = zbv.toFixed(3) ;
 }





document.getElementById("ox").value = + zcc ;
document.getElementById("oy").value = + zvv ;
document.getElementById("oz").value = + zbb ;



}

let angle = 0;
    function rotate(deg) {
      angle += deg;
      document.getElementById("myImage").style.transform = `rotate(${angle}deg)`;
    }