const sharp=require('sharp'),path=require('path'),fs=require('fs');
const FRAME_DIR=path.join(__dirname,'../../assets/creature-hunt/frames');
const FRAME_MAP={COMMON:'C.png',UNCOMMON:'UC.png',RARE:'R.png',EPIC:'E.png',LEGENDARY:'L.png',MYTHIC:'M.png',CELESTIAL:'CO.png',SECRET:'SC.png'};
async function render(pet,owned={}){
 const frameName=FRAME_MAP[String(pet.rarity||'COMMON').toUpperCase()]||FRAME_MAP.COMMON;
 const frame=path.join(FRAME_DIR,frameName);
 if(!fs.existsSync(frame))return sharp(pet.asset).png().toBuffer();
 // Authored frames are 1024x1536 portrait cards. Fit the Pet into the clear art window,
 // then composite the transparent frame on top. This preserves the user's original artwork.
 const fw=1024,fh=1536,petW=820,petH=930,left=102,top=300;
 const petLayer=await sharp(pet.asset).resize(petW,petH,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 return sharp({create:{width:fw,height:fh,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
  .composite([{input:petLayer,left,top},{input:frame,left:0,top:0}]).png().toBuffer();
}
module.exports={render,FRAME_MAP,FRAME_DIR};
