/* Piano greetings reuse the existing distribution's licensed piano samples. */
(() => {
  'use strict';
  let ctx=null,master=null,loading=null,spec=null,buffer=null,token=0,endTimer=null;
  const voices=new Set(),listeners=new Set();
  function emit(state){for(const f of listeners){try{f(state)}catch{}}}
  function stop(suspend=false){
    token++;clearTimeout(endTimer);endTimer=null;
    for(const v of voices){try{v.stop()}catch{}}voices.clear();
    if(suspend&&ctx?.state==='running')ctx.suspend().catch(()=>{});
    emit({playing:false,loading:false});
  }
  async function ready(){
    if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('이 브라우저는 피아노 소리를 지원하지 않아요.');ctx=new AC({latencyHint:'interactive'});master=ctx.createGain();master.gain.value=.8;master.connect(ctx.destination)}
    await ctx.resume();
    if(!loading){loading=(async()=>{
      const base=new URL('../sound/piano/',document.baseURI);
      const response=await fetch(new URL('sound.json',base));if(!response.ok)throw Error('피아노 음원 정보를 읽지 못했어요.');spec=await response.json();
      const layer=spec.layers.indexOf(80);if(layer<0)throw Error('피아노 음원 구성을 확인해 주세요.');spec.selectedLayer=layer;
      const audio=await fetch(new URL(spec.files[layer],base));if(!audio.ok)throw Error('피아노 녹음을 읽지 못했어요.');buffer=await ctx.decodeAudioData(await audio.arrayBuffer());
      return buffer;
    })().catch(e=>{loading=null;throw e})}
    return loading;
  }
  function note(pitch,time,duration,gain){
    let k=0;for(let i=1;i<spec.roots.length;i++)if(Math.abs(spec.roots[i]-pitch)<Math.abs(spec.roots[k]-pitch))k=i;
    const [start,length]=spec.segments[spec.selectedLayer][k],v=ctx.createBufferSource(),g=ctx.createGain(),rate=2**((pitch-spec.roots[k])/12),end=time+duration;
    v.buffer=buffer;v.playbackRate.value=rate;g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(gain,time+.008);g.gain.setValueAtTime(gain,Math.max(time+.009,end-.06));g.gain.linearRampToValueAtTime(0,end+.18);
    v.connect(g);g.connect(master);voices.add(v);v.onended=()=>{voices.delete(v);v.disconnect();g.disconnect()};
    // Supplying the segment duration prevents accidentally reading the next recorded note.
    v.start(time,start/spec.sr,length/spec.sr);v.stop(Math.min(end+.19,time+length/spec.sr/rate+.01));
  }
  async function play(m,label='친구'){
    stop(false);const own=token;
    if(!m||!Array.isArray(m.voicedMidi)||!Array.isArray(m.motifMidi)||!Array.isArray(m.durationsQuarterUnits)||m.motifMidi.length!==m.durationsQuarterUnits.length)throw Error('친구의 피아노 인사를 찾지 못했어요.');
    const notes=[...m.voicedMidi,...m.motifMidi];if(!notes.every(n=>Number.isInteger(n)&&n>=21&&n<=108))throw Error('연주 음역을 확인해 주세요.');
    const bpm=Number(m.tempoQuarterBpm);if(!(bpm>=30&&bpm<=240)||!m.durationsQuarterUnits.every(d=>d>0&&d<=16))throw Error('박자 정보를 확인해 주세요.');
    emit({playing:false,loading:true,label});
    try{
      await ready();if(own!==token)return;
      const q=60/bpm,bar=m.durationsQuarterUnits.reduce((a,b)=>a+b,0),t=ctx.currentTime+.06;
      for(const n of m.voicedMidi)note(n,t,bar*q*.82,.82/Math.sqrt(m.voicedMidi.length));
      let at=t+bar*q;for(let i=0;i<m.motifMidi.length;i++){note(m.motifMidi[i],at,m.durationsQuarterUnits[i]*q*.84,.95);at+=m.durationsQuarterUnits[i]*q}
      emit({playing:true,loading:false,label,chord:m.chordSymbol,meter:m.meter});
      endTimer=setTimeout(()=>{if(own===token)stop(false)},Math.max(0,(at-ctx.currentTime+.3)*1000));
    }catch(e){if(own===token){stop(false);emit({playing:false,loading:false,error:e.message||String(e)})}throw e}
  }
  window.addEventListener('pagehide',()=>stop(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)stop(true)});
  window.PawMuseumAudio=Object.freeze({play,stop,onState(fn){listeners.add(fn);return()=>listeners.delete(fn)},get state(){return {activeVoices:voices.size,context:ctx?.state||'uninitialized'}},version:'1.0.0'});
})();
