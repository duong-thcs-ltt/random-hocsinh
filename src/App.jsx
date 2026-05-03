import { useState, useEffect, useRef, useCallback } from "react";

// ===== WEB AUDIO ENGINE =====
let _audioCtx = null;
const getCtx = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
};
const beep = (freq, dur, type = "sine", vol = 0.3, delay = 0) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.05);
  } catch (e) {}
};

// Nhịp tim hồi hộp
const heartbeat = (s) => { if (!s) return; beep(60,0.08,"sine",0.5,0); beep(55,0.07,"sine",0.4,0.12); };

// Trống cuộn suspense
const drumroll = (s, spd=1) => {
  if (!s) return;
  const n = Math.floor(14/spd);
  for (let i=0;i<n;i++) setTimeout(() => beep(100+i*4,0.05,"sawtooth",0.28), i*(spd*26));
};

// Leo thang hồi hộp
const riseUp = (s) => {
  if (!s) return;
  [261,294,330,349,392,440,494,523,587,659,784,880,1047,1175].forEach((f,i) =>
    setTimeout(() => beep(f,0.1,"triangle",0.18), i*75));
};

// Fanfare chiến thắng
const fanfare = (s) => {
  if (!s) return;
  [[523,0],[523,130],[523,260],[659,390],[523,540],[659,670],[784,800],[784,1000],[659,1130],[523,1260]]
    .forEach(([f,t]) => { if(f) beep(f,0.22,"sine",0.38,t/1000); });
  setTimeout(()=>{ beep(261,1.2,"triangle",0.14); beep(392,1.1,"triangle",0.11); beep(523,1.0,"sine",0.1); },900);
};

// Tích tắc theo phase (chậm → nhanh → rất nhanh)
const tensionTick = (s,phase) => {
  if (!s) return;
  const f=[580,800,1050,1500][phase]||1500;
  const v=[0.16,0.22,0.3,0.42][phase]||0.42;
  beep(f,0.05,"square",v);
};

// Nổ bom
const explosion = (s) => {
  if (!s) return;
  beep(80,0.9,"sawtooth",0.65); setTimeout(()=>beep(50,0.6,"square",0.5),90);
  setTimeout(()=>beep(40,0.5,"sine",0.4),220); setTimeout(()=>beep(30,0.4,"sine",0.3),430);
};

// Slot cuộn
const slotTick = (s,c) => { if (!s) return; beep(280+c*3,0.04,"square",0.1); };

// Quack vịt
const quack = (s) => { if (!s) return; beep(440,0.07,"sawtooth",0.2); setTimeout(()=>beep(370,0.08,"sawtooth",0.17),90); };

// Whoosh phi tiêu
const whoosh = (s) => { if (!s) return; for(let i=0;i<12;i++) setTimeout(()=>beep(820-i*28,0.05,"sawtooth",0.2-i*0.01),i*55); };

// Ping plinko
const ping = (s) => { if (!s) return; beep(800+Math.random()*400,0.1,"triangle",0.18); };

// Pop bóng
const balloonPop = (s) => { if (!s) return; beep(1300,0.04,"sawtooth",0.4); setTimeout(()=>beep(650,0.06,"square",0.22),35); };

// ===== DATA =====
const SAMPLE = [
  "Nguyễn Văn An","Trần Thị Bình","Lê Văn Cường","Phạm Thị Dung","Hoàng Văn Em",
  "Ngô Thị Phương","Đặng Văn Giang","Bùi Thị Hoa","Lý Văn Inh","Vũ Thị Kim",
  "Đinh Văn Long","Trịnh Thị Mai","Phan Văn Nam","Hồ Thị Oanh","Dương Văn Phong",
  "Cao Thị Quyên","Nguyễn Thị Rạng","Lê Văn Sơn","Phạm Thị Tâm","Vũ Văn Uy",
];
const COLORS = ["#FF6B6B","#4ECDC4","#FFD93D","#6C5CE7","#E17055","#00B894","#FD79A8","#74B9FF","#FDCB6E","#A29BFE"];
const MODES = [
  { id:"wheel",   emoji:"🎡", name:"VÒNG QUAY\nMAY MẮN"  },
  { id:"duck",    emoji:"🦆", name:"ĐUA VỊT"              },
  { id:"jackpot", emoji:"🎰", name:"MÁY JACKPOT"          },
  { id:"bomb",    emoji:"💣", name:"BOM NỔ\nCHẬM"         },
  { id:"dice",    emoji:"🎲", name:"XÚC XẮC\nMAY RỦI"     },
  { id:"dart",    emoji:"🎯", name:"PHÓNG PHI TIÊU"        },
  { id:"tarot",   emoji:"🃏", name:"RÚT BÀI TAROT"        },
  { id:"plinko",  emoji:"⚪", name:"PLINKO RƠI\nBÓNG"     },
  { id:"rain",    emoji:"🌧️", name:"MƯA TÊN"            },
  { id:"balloon", emoji:"🎈", name:"BẮN BÓNG\nBÓNG"       },
  { id:"claw",    emoji:"🪝", name:"MÁY GẮP THÚ"          },
  { id:"letter",  emoji:"💌", name:"THƯ BÍ ẨN"            },
];

const lastName = n => n.trim().split(" ").pop();
const randItem = a => a[Math.floor(Math.random()*a.length)];

// ===== UI HELPERS =====
function SuspenseBar({ active, duration=4 }) {
  const [w,setW]=useState(0);
  useEffect(()=>{ if(!active){setW(0);return;} setW(0); const t=setTimeout(()=>setW(100),60); return ()=>clearTimeout(t); },[active]);
  if(!active) return null;
  return (
    <div style={{height:5,background:"#e2e8f0",borderRadius:3,overflow:"hidden",margin:"10px 0"}}>
      <div style={{height:"100%",background:"linear-gradient(90deg,#FF6B6B,#FFD93D,#4ECDC4,#6C5CE7)",
        width:`${w}%`,transition:`width ${duration}s linear`,borderRadius:3}}/>
    </div>
  );
}
function Pulse({ active }) {
  if (!active) return null;
  return <span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:"#FF6B6B",
    marginRight:8,animation:"heartPulse 0.65s ease-in-out infinite"}}/>;
}
function ResultBadge({ name, color, emoji, textDark }) {
  return (
    <div style={{marginTop:14,padding:"14px 20px",background:`linear-gradient(135deg,${color},${color}cc)`,
      borderRadius:16,color:textDark?"#333":"#fff",fontSize:18,fontWeight:800,textAlign:"center",
      boxShadow:`0 6px 22px ${color}66`,animation:"popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)"}}>
      {emoji&&<span style={{marginRight:6}}>{emoji}</span>}🎉 {name}
    </div>
  );
}
function ActionBtn({ label, onClick, disabled, color, textDark }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{marginTop:12,width:"100%",padding:"14px",background:disabled?"#ccc":color,
        color:disabled?"#999":textDark?"#222":"#fff",border:"none",borderRadius:14,
        fontSize:15,fontWeight:800,cursor:disabled?"default":"pointer",letterSpacing:0.5,
        transition:"all 0.2s",boxShadow:disabled?"none":`0 5px 18px ${color}55`}}>
      {label}
    </button>
  );
}

// ===========================
// MODE: VÒNG QUAY (9s, chậm rõ)
// ===========================
function WheelMode({ students, onResult, soundOn }) {
  const canvasRef=useRef(null);
  const [spinning,setSpinning]=useState(false);
  const [result,setResult]=useState(null);
  const [phase,setPhase]=useState("idle");
  const angleRef=useRef(0);

  const draw=useCallback(angle=>{
    const c=canvasRef.current; if(!c) return;
    const ctx=c.getContext("2d"),cx=c.width/2,cy=c.height/2,r=cx-8;
    const n=students.length,arc=(2*Math.PI)/n;
    ctx.clearRect(0,0,c.width,c.height);
    students.forEach((name,i)=>{
      const s=angle+i*arc,e=s+arc;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,s,e);
      ctx.fillStyle=COLORS[i%COLORS.length];ctx.fill();
      ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();
      ctx.save();ctx.translate(cx,cy);ctx.rotate(s+arc/2);
      ctx.textAlign="right";ctx.fillStyle="#fff";
      ctx.font=`bold ${Math.min(13,100/n)}px sans-serif`;
      ctx.fillText(lastName(name),r-6,4);ctx.restore();
    });
    ctx.beginPath();ctx.arc(cx,cy,18,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();
    ctx.strokeStyle="#ddd";ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+r+4,cy);ctx.lineTo(cx+r-14,cy-9);ctx.lineTo(cx+r-14,cy+9);
    ctx.fillStyle="#222";ctx.fill();
  },[students]);

  useEffect(()=>{draw(0);},[draw]);

  const spin=()=>{
    if(spinning||!students.length) return;
    setSpinning(true);setResult(null);setPhase("fast");
    drumroll(soundOn,0.4);
    const TOTAL_DUR=10000; // 10 giây
    const total=(Math.random()*12+20)*Math.PI*2;
    const t0=performance.now(),base=angleRef.current;
    let lastTick=0;
    const go=now=>{
      const p=Math.min((now-t0)/TOTAL_DUR,1);
      // Easing sắc nét: nhanh 60% đầu, chậm dần 40% sau
      const ease=p<0.55?p/0.55*0.82:0.82+((p-0.55)/0.45)*0.18;
      const smooth=1-Math.pow(1-ease,4.5);
      angleRef.current=base+total*smooth;
      draw(angleRef.current);
      if(p<0.5) setPhase("fast");
      else if(p<0.75) setPhase("slowing");
      else setPhase("veryslow");
      const a=angleRef.current;
      if(Math.abs(a-lastTick)>0.25){
        lastTick=a;
        if(p>0.55) tensionTick(soundOn,p>0.88?3:p>0.77?2:1);
        if(p>0.75&&Math.random()<0.3) heartbeat(soundOn);
      }
      if(p<1){requestAnimationFrame(go);return;}
      setPhase("done");setSpinning(false);
      const n=students.length,arc=(2*Math.PI)/n;
      const norm=((angleRef.current%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
      const win=students[Math.floor(((2*Math.PI-norm)%(2*Math.PI))/arc)%n];
      setResult(win);fanfare(soundOn);onResult(win,"Vòng quay may mắn");
    };
    requestAnimationFrame(go);
  };

  return (
    <div style={{textAlign:"center"}}>
      <canvas ref={canvasRef} width={260} height={260}
        style={{display:"block",margin:"0 auto",borderRadius:"50%",
          boxShadow:phase==="veryslow"?"0 0 35px rgba(255,107,107,0.7)":"0 4px 20px rgba(0,0,0,0.15)",
          transition:"box-shadow 0.6s"}}/>
      {spinning&&<div style={{marginTop:8,fontSize:12,color:"#FF6B6B",fontWeight:700,letterSpacing:1}}>
        <Pulse active={phase==="veryslow"}/>
        {phase==="fast"?"🌀 ĐANG QUAY NHANH...":phase==="slowing"?"🐌 ĐANG CHẬM DẦN...":"⚡ SẮP DỪNG!"}
      </div>}
      <SuspenseBar active={spinning} duration={10}/>
      {result&&<ResultBadge name={result} color="#FF6B6B" emoji="🎡"/>}
      <ActionBtn label={spinning?"ĐANG QUAY...":"🎡 QUAY NGAY"} disabled={spinning||!students.length} onClick={spin} color="#FF6B6B"/>
    </div>
  );
}

// ===========================
// MODE: ĐUA VỊT (chậm, drama)
// ===========================
function DuckMode({ students, onResult, soundOn }) {
  const [ducks,setDucks]=useState([]);
  const [racing,setRacing]=useState(false);
  const [winner,setWinner]=useState(null);
  const rafRef=useRef(null);
  const tickRef=useRef(0);

  const start=()=>{
    if(!students.length) return;
    setWinner(null);
    const list=students.slice(0,Math.min(6,students.length));
    const ds=list.map((name,i)=>({name,pos:0,speed:0.35+Math.random()*0.45,boost:0,color:COLORS[i],floatPhase:Math.random()*Math.PI*2}));
    setDucks(ds);setRacing(true);tickRef.current=0;
    drumroll(soundOn,1.2);
    const go=()=>{
      tickRef.current++;
      const t=tickRef.current;
      setDucks(prev=>{
        const upd=prev.map(d=>{
          const boost=Math.random()<0.04?Math.random()*2:0;
          const slow=d.pos>72?0.5:d.pos>88?0.28:1;
          const np=Math.min(d.pos+(d.speed+boost)*slow*0.5,100);
          return{...d,pos:np,boost};
        });
        if(t%10===0) quack(soundOn);
        if(t%18===0) tensionTick(soundOn,upd.some(d=>d.pos>82)?2:1);
        if(upd.some(d=>d.pos>88)) heartbeat(soundOn);
        const done=upd.find(d=>d.pos>=100);
        if(done){setRacing(false);setWinner(done.name);fanfare(soundOn);onResult(done.name,"Đua vịt");return upd;}
        rafRef.current=requestAnimationFrame(go);
        return upd;
      });
    };
    rafRef.current=requestAnimationFrame(go);
  };

  return (
    <div>
      <div style={{background:"linear-gradient(180deg,#1a3a5c,#2d6a9f)",borderRadius:12,padding:12,minHeight:210}}>
        {!ducks.length?<div style={{textAlign:"center",paddingTop:80,color:"rgba(255,255,255,0.5)"}}>🦆 Nhấn BẮT ĐẦU để đua!</div>
        :ducks.map((d,i)=>(
          <div key={i} style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(255,255,255,0.7)",marginBottom:2}}>
              <span>{lastName(d.name)}</span><span>{Math.round(d.pos)}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.15)",borderRadius:20,height:32,position:"relative",overflow:"hidden",
              border:`2px solid ${d.pos>88?"#FFD93D":"rgba(255,255,255,0.15)"}`,
              boxShadow:d.pos>88?"0 0 12px rgba(255,215,0,0.6)":"none",transition:"border 0.3s,box-shadow 0.3s"}}>
              <div style={{position:"absolute",left:`${Math.min(d.pos,91)}%`,top:"50%",transform:"translateY(-50%)",
                fontSize:d.boost>0?28:24,transition:"left 0.07s linear,font-size 0.08s",
                filter:d.boost>0?"drop-shadow(0 0 6px gold)":"none"}}>🦆</div>
              {d.pos>=100&&<div style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",fontSize:18}}>🏁</div>}
            </div>
          </div>
        ))}
        {racing&&<SuspenseBar active duration={10}/>}
      </div>
      {winner&&<ResultBadge name={winner} color="#4ECDC4" emoji="🏆"/>}
      <ActionBtn label={racing?"🦆 ĐANG ĐUA...":"🏁 BẮT ĐẦU ĐUA"} disabled={racing||!students.length} onClick={start} color="#4ECDC4" textDark/>
    </div>
  );
}

// ===========================
// MODE: MÁY JACKPOT (chậm dần từng reel)
// ===========================
function JackpotMode({ students, onResult, soundOn }) {
  const [reels,setReels]=useState(["?","?","?"]);
  const [stopped,setStopped]=useState([false,false,false]);
  const [spinning,setSpinning]=useState(false);
  const [result,setResult]=useState(null);

  const spin=()=>{
    if(spinning||!students.length) return;
    setSpinning(true);setResult(null);setStopped([false,false,false]);
    const win=randItem(students);
    const parts=win.split(" ");
    const r1=parts[0]||"★",r2=parts[1]||parts[0]||"★",r3=parts[parts.length-1]||"★";
    let c=0;
    drumroll(soundOn,0.7);
    const TOTAL=50;
    const iv=setInterval(()=>{
      c++;
      slotTick(soundOn,c);
      setReels(prev=>{
        const nr=[...prev];
        if(c<38) nr[0]=lastName(randItem(students));
        else if(c===38){nr[0]=r1;setStopped(s=>[true,s[1],s[2]]);tensionTick(soundOn,2);}
        if(c<44) nr[1]=lastName(randItem(students));
        else if(c===44){nr[1]=r2;setStopped(s=>[s[0],true,s[2]]);tensionTick(soundOn,3);}
        if(c<TOTAL) nr[2]=lastName(randItem(students));
        return nr;
      });
      if(c>=TOTAL){
        clearInterval(iv);
        setReels([r1,r2,r3]);setStopped([true,true,true]);
        setSpinning(false);setResult(win);
        fanfare(soundOn);onResult(win,"Máy Jackpot");
      }
    },95);
  };

  return (
    <div style={{textAlign:"center"}}>
      <div style={{background:"linear-gradient(135deg,#1a1a2e,#2d2d5e)",borderRadius:20,padding:24,display:"inline-block",boxShadow:"0 8px 30px rgba(0,0,0,0.5)"}}>
        <div style={{color:"#FFD93D",fontSize:13,letterSpacing:3,marginBottom:14,fontWeight:700}}>🎰 JACKPOT 🎰</div>
        <div style={{display:"flex",gap:10}}>
          {reels.map((r,i)=>(
            <div key={i} style={{width:78,height:82,background:"#fff",borderRadius:12,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,fontWeight:800,color:"#333",
              border:`3px solid ${stopped[i]?"#FFD93D":"#444"}`,
              overflow:"hidden",padding:4,textAlign:"center",
              boxShadow:stopped[i]?"0 0 20px #FFD93D99":"none",transition:"border 0.4s,box-shadow 0.4s"}}>
              {spinning&&!stopped[i]?<span style={{fontSize:24,opacity:0.5,animation:"reelSpin 0.12s infinite"}}>▼</span>:r}
            </div>
          ))}
        </div>
        {spinning&&!stopped[2]&&<div style={{color:"#888",fontSize:11,marginTop:12,fontWeight:600}}>
          <Pulse active={stopped[0]||stopped[1]}/>
          {!stopped[0]?"CUỘN...":!stopped[1]?"CHẬM DẦN...":"SẮP DỪNG!"}
        </div>}
        <div style={{color:"#666",fontSize:10,marginTop:10}}>[ {students.length} HỌC SINH ]</div>
      </div>
      <SuspenseBar active={spinning} duration={5}/>
      {result&&<ResultBadge name={result} color="#FFD93D" emoji="🎰" textDark/>}
      <ActionBtn label={spinning?"CUỘN ĐANG DỪNG...":"🎰 KÉO TAY QUAY"} disabled={spinning||!students.length} onClick={spin} color="#FFD93D" textDark/>
    </div>
  );
}

// ===========================
// MODE: BOM NỔ CHẬM (30-40 bước, tăng dần)
// ===========================
function BombMode({ students, onResult, soundOn }) {
  const [active,setActive]=useState(false);
  const [current,setCurrent]=useState("");
  const [countdown,setCountdown]=useState(null);
  const [exploded,setExploded]=useState(false);
  const [result,setResult]=useState(null);
  const [shake,setShake]=useState(false);
  const toRef=useRef(null);

  const activate=()=>{
    if(active||!students.length) return;
    setActive(true);setExploded(false);setResult(null);setShake(false);
    const win=randItem(students);
    const total=30+Math.floor(Math.random()*12);
    let tick=0;
    const shuffled=[...students].sort(()=>Math.random()-0.5);
    const next=()=>{
      tick++;
      const rem=total-tick;
      setCountdown(rem);
      setCurrent(shuffled[tick%shuffled.length]);
      const phase=tick<total*0.38?0:tick<total*0.62?1:tick<total*0.83?2:3;
      const delays=[560,360,200,95];
      tensionTick(soundOn,phase);
      if(rem<=8) heartbeat(soundOn);
      if(rem<=5) setShake(true);
      if(tick>=total){
        setCurrent(win);setExploded(true);setCountdown(null);
        setActive(false);setResult(win);setShake(false);
        explosion(soundOn);setTimeout(()=>onResult(win,"Bom nổ chậm"),400);return;
      }
      toRef.current=setTimeout(next,delays[phase]);
    };
    toRef.current=setTimeout(next,560);
  };

  return (
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:exploded?115:active&&countdown<=5?85:72,
        transition:"font-size 0.18s",marginBottom:10,
        filter:active&&countdown<=6?"drop-shadow(0 0 18px #FF6B6B)":"none",
        animation:shake?"bombShake 0.14s infinite":exploded?"bombExplode 0.5s ease-out":"none"}}>
        {exploded?"💥":"💣"}
      </div>
      {countdown!==null&&(
        <div style={{fontSize:58,fontWeight:900,marginBottom:8,
          color:countdown<=4?"#FF6B6B":countdown<=10?"#FFD93D":"#444",
          transition:"color 0.3s",animation:countdown<=4?"countdown 0.5s ease infinite":countdown<=9?"countdown 0.85s ease infinite":"none"}}>
          {countdown}
        </div>
      )}
      {current&&!exploded&&(
        <div style={{fontSize:20,fontWeight:700,
          color:countdown<=5?"#FF6B6B":"#444",
          background:countdown<=5?"#FFE5E5":"#f3f3f3",
          padding:"10px 26px",borderRadius:22,display:"inline-block",marginBottom:8,
          boxShadow:countdown<=5?"0 0 14px rgba(255,107,107,0.35)":"none",transition:"all 0.12s"}}>
          {current}
        </div>
      )}
      {active&&<SuspenseBar active duration={18}/>}
      {exploded&&result&&<ResultBadge name={`${result} bị dính bom! 💥`} color="#FF6B6B" emoji=""/>}
      <ActionBtn label={active?`💣 TÍCH TẮC... (${countdown??""})`:"💣 KÍCH HOẠT BOM"}
        disabled={active||!students.length} onClick={activate} color="#2d2d2d"/>
    </div>
  );
}

// ===========================
// MODE: XÚC XẮC (35 bước, chậm dần)
// ===========================
function DiceMode({ students, onResult, soundOn }) {
  const FACES=["⚀","⚁","⚂","⚃","⚄","⚅"];
  const [rolling,setRolling]=useState(false);
  const [face,setFace]=useState("⚀");
  const [blur,setBlur]=useState(0);
  const [result,setResult]=useState(null);

  const roll=()=>{
    if(rolling||!students.length) return;
    setRolling(true);setResult(null);
    const win=randItem(students);
    drumroll(soundOn,1.3);
    let c=0,TOTAL=38;
    const next=()=>{
      c++;
      const ph=c<12?0:c<22?1:c<30?2:3;
      const delays=[55,95,160,300];
      setFace(FACES[Math.floor(Math.random()*6)]);
      setBlur([4,2.5,1,0][ph]);
      tensionTick(soundOn,ph);
      if(ph>=2) heartbeat(soundOn);
      if(c>=TOTAL){setBlur(0);setRolling(false);setResult(win);fanfare(soundOn);onResult(win,"Xúc xắc may rủi");return;}
      setTimeout(next,delays[ph]);
    };
    setTimeout(next,55);
  };

  return (
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:112,marginBottom:10,filter:`blur(${blur}px)`,transition:"filter 0.08s",userSelect:"none",
        animation:rolling&&blur>1?"diceSpin 0.14s infinite":"none"}}>
        {face}
      </div>
      <SuspenseBar active={rolling} duration={6}/>
      {result&&<ResultBadge name={result} color="#6C5CE7" emoji="🎲"/>}
      <ActionBtn label={rolling?"ĐANG LĂN...":"🎲 LĂN XÚC XẮC"} disabled={rolling||!students.length} onClick={roll} color="#6C5CE7"/>
    </div>
  );
}

// ===========================
// MODE: PHI TIÊU (nhắm 3s → phóng)
// ===========================
function DartMode({ students, onResult, soundOn }) {
  const [phase,setPhase]=useState("idle");
  const [aimX,setAimX]=useState(50);
  const [aimY,setAimY]=useState(50);
  const [hitX,setHitX]=useState(50);
  const [hitY,setHitY]=useState(50);
  const [result,setResult]=useState(null);
  const [cntd,setCntd]=useState(null);

  const throwDart=()=>{
    if(phase!=="idle"||!students.length) return;
    const win=randItem(students);
    const tx=28+Math.random()*44,ty=28+Math.random()*44;
    setPhase("aim");setCntd(3);setResult(null);
    riseUp(soundOn);
    let cnt=3;
    const iv=setInterval(()=>{
      cnt--;setCntd(cnt);
      setAimX(50+Math.sin(cnt*5)*(22-cnt*6));
      setAimY(50+Math.cos(cnt*4)*(16-cnt*5));
      tensionTick(soundOn,3-cnt);
      if(cnt<=0){
        clearInterval(iv);setCntd(null);setPhase("throw");whoosh(soundOn);
        setTimeout(()=>{
          setHitX(tx);setHitY(ty);setPhase("hit");
          setResult(win);fanfare(soundOn);onResult(win,"Phóng phi tiêu");
        },900);
      }
    },1000);
  };

  return (
    <div style={{textAlign:"center"}}>
      <div style={{position:"relative",width:230,height:230,margin:"0 auto",borderRadius:"50%",
        background:"radial-gradient(circle,#111 11%,#fff 11% 24%,#FF6B6B 24% 37%,#fff 37% 50%,#FF6B6B 50% 63%,#fff 63% 76%,#FF6B6B 76% 89%,#fff 89%)",
        boxShadow:"0 6px 28px rgba(0,0,0,0.25)"}}>
        {phase==="aim"&&(
          <div style={{position:"absolute",left:`${aimX}%`,top:`${aimY}%`,
            transform:"translate(-50%,-50%)",zIndex:10,pointerEvents:"none",transition:"left 0.32s ease,top 0.32s ease"}}>
            <div style={{width:44,height:44,border:"2.5px solid #FF6B6B",borderRadius:"50%",
              boxShadow:"0 0 14px #FF6B6B",opacity:0.9}}/>
            <div style={{position:"absolute",top:"50%",left:0,right:0,height:2,background:"#FF6B6B",transform:"translateY(-50%)"}}/> 
            <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:2,background:"#FF6B6B",transform:"translateX(-50%)"}}/>
          </div>
        )}
        {phase==="throw"&&(
          <div style={{position:"absolute",top:"50%",left:"-5%",fontSize:30,animation:"dartFly2 0.9s ease-in forwards",zIndex:11}}>🏹</div>
        )}
        {phase==="hit"&&(
          <div style={{position:"absolute",left:`${hitX}%`,top:`${hitY}%`,transform:"translate(-50%,-50%)",
            fontSize:30,zIndex:10,animation:"dartHit 0.35s ease-out"}}>🎯</div>
        )}
        {cntd!==null&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:64,fontWeight:900,color:"#FF6B6B",textShadow:"0 0 24px #FF6B6B",zIndex:20,
            animation:"countdown 0.9s ease infinite"}}>{cntd}</div>
        )}
      </div>
      {phase==="aim"&&<SuspenseBar active duration={3}/>}
      {result&&phase==="hit"&&<ResultBadge name={result} color="#E17055" emoji="🎯"/>}
      <ActionBtn
        label={phase==="idle"?"🎯 PHÓNG PHI TIÊU":phase==="aim"?`🎯 ĐANG NHẮM... (${cntd??""})`:phase==="throw"?"🏹 ĐANG BAY...":"🎯 PHÓNG LẠI"}
        disabled={phase!=="idle"&&phase!=="hit"||!students.length}
        onClick={()=>{if(phase==="hit"){setPhase("idle");setResult(null);}else throwDart();}}
        color="#E17055"/>
    </div>
  );
}

// ===========================
// MODE: TAROT (3s glow suspense)
// ===========================
function TarotMode({ students, onResult, soundOn }) {
  const [phase,setPhase]=useState("idle");
  const [result,setResult]=useState(null);
  const [glow,setGlow]=useState(0);

  const flip=()=>{
    if(phase!=="idle"||!students.length) return;
    const win=randItem(students);
    setPhase("glow");setResult(null);riseUp(soundOn);
    let g=0;
    const gv=setInterval(()=>{
      g+=0.12;setGlow(Math.sin(g*2.2)*0.5+0.5);
      if(g%1.5<0.15) tensionTick(soundOn,g>3?3:g>2?2:1);
      if(g>3.5){clearInterval(gv);setGlow(1);setPhase("flip");
        setTimeout(()=>{setPhase("done");setResult(win);fanfare(soundOn);onResult(win,"Rút bài Tarot");},1300);}
    },100);
  };

  return (
    <div style={{textAlign:"center"}}>
      <div style={{perspective:700,display:"inline-block",marginBottom:16,cursor:phase==="idle"?"pointer":"default"}}
        onClick={phase==="idle"?flip:undefined}>
        <div style={{width:145,height:215,transition:"transform 1.3s cubic-bezier(0.4,0,0.2,1)",
          transformStyle:"preserve-3d",transform:phase==="done"?"rotateY(180deg)":"rotateY(0)",
          position:"relative",
          filter:phase==="glow"?`drop-shadow(0 0 ${glow*22}px rgba(162,155,254,0.95))`
            :phase==="done"?"drop-shadow(0 0 16px rgba(162,155,254,0.65))":"none"}}>
          <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",
            background:"linear-gradient(135deg,#1a0a4e,#5a3ea8,#a29bfe)",
            borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:52,boxShadow:"0 8px 30px rgba(0,0,0,0.4)"}}>
            {phase==="glow"?<span style={{animation:"mysticalPulse 0.55s ease infinite"}}>🌟</span>:"🃏"}
          </div>
          <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",
            background:"linear-gradient(135deg,#ffecd2,#fcb69f)",
            borderRadius:14,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",
            transform:"rotateY(180deg)",boxShadow:"0 8px 28px rgba(0,0,0,0.35)",padding:16}}>
            <div style={{fontSize:36,marginBottom:10}}>⭐</div>
            <div style={{fontSize:14,fontWeight:800,color:"#333",textAlign:"center",lineHeight:1.55}}>{result}</div>
          </div>
        </div>
      </div>
      {phase==="glow"&&<div style={{color:"#A29BFE",fontSize:12,fontWeight:700,marginBottom:6,animation:"mysticalPulse 0.8s ease infinite"}}>✨ Lá bài đang hiển linh...</div>}
      {phase==="glow"&&<SuspenseBar active duration={3.5}/>}
      {phase==="done"&&result&&<ResultBadge name={result} color="#A29BFE" emoji="🃏"/>}
      <ActionBtn
        label={phase==="idle"?"🃏 RÚT BÀI TAROT":phase==="glow"?"✨ ĐANG HIỂN LINH...":phase==="flip"?"🃏 ĐANG LẬT BÀI...":"🃏 RÚT LẠI"}
        disabled={(phase!=="idle"&&phase!=="done")||!students.length}
        onClick={()=>{if(phase==="done"){setPhase("idle");setResult(null);}else flip();}}
        color="#6C5CE7"/>
    </div>
  );
}

// ===========================
// MODE: PLINKO (chậm, vật lý rõ)
// ===========================
function PlinkoMode({ students, onResult, soundOn }) {
  const canvasRef=useRef(null);
  const [dropping,setDropping]=useState(false);
  const [result,setResult]=useState(null);

  const drop=()=>{
    if(dropping||!students.length) return;
    setDropping(true);setResult(null);
    const canvas=canvasRef.current;
    const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
    const pegs=[];
    for(let row=0;row<8;row++) for(let col=0;col<=row;col++)
      pegs.push({x:W/2-row*17+col*34,y:25+row*27});
    let ball={x:W/2+(Math.random()-0.5)*8,y:8,vx:(Math.random()-0.5)*0.8,vy:1.0};
    const win=randItem(students);
    riseUp(soundOn);
    let frame=0;
    const go=()=>{
      frame++;
      // Chậm hơn: chỉ update mỗi 2 frame
      if(frame%2===0){
        ball.vy=Math.min(ball.vy+0.12,3.5);
        ball.x+=ball.vx;ball.y+=ball.vy;
        pegs.forEach(p=>{
          const dx=ball.x-p.x,dy=ball.y-p.y;
          if(Math.sqrt(dx*dx+dy*dy)<14){
            const a=Math.atan2(dy,dx);
            ball.vx=Math.cos(a)*2.8+(Math.random()-0.5)*1.6;
            ball.vy=Math.abs(Math.sin(a))*2.8;
            ping(soundOn);
          }
        });
        if(ball.x<12){ball.x=12;ball.vx=Math.abs(ball.vx);}
        if(ball.x>W-12){ball.x=W-12;ball.vx=-Math.abs(ball.vx);}
      }
      ctx.clearRect(0,0,W,H);
      const bg=ctx.createLinearGradient(0,0,0,H);
      bg.addColorStop(0,"#0f1729");bg.addColorStop(1,"#1a2744");
      ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
      pegs.forEach(p=>{
        ctx.beginPath();ctx.arc(p.x,p.y,6,0,Math.PI*2);
        ctx.fillStyle="#6C5CE7";ctx.fill();
        ctx.beginPath();ctx.arc(p.x-2,p.y-2,2,0,Math.PI*2);
        ctx.fillStyle="rgba(255,255,255,0.6)";ctx.fill();
      });
      // Trail
      ctx.beginPath();ctx.arc(ball.x,ball.y+6,8,0,Math.PI*2);
      ctx.fillStyle="rgba(255,107,107,0.15)";ctx.fill();
      // Ball
      ctx.beginPath();ctx.arc(ball.x,ball.y,11,0,Math.PI*2);
      const bg2=ctx.createRadialGradient(ball.x-3,ball.y-3,1,ball.x,ball.y,11);
      bg2.addColorStop(0,"#FF9999");bg2.addColorStop(1,"#FF6B6B");
      ctx.fillStyle=bg2;ctx.fill();
      ctx.beginPath();ctx.arc(ball.x-3,ball.y-3,3.5,0,Math.PI*2);
      ctx.fillStyle="rgba(255,255,255,0.55)";ctx.fill();
      if(ball.y<H-20){requestAnimationFrame(go);}
      else{setDropping(false);setResult(win);fanfare(soundOn);onResult(win,"Plinko rơi bóng");}
    };
    requestAnimationFrame(go);
  };

  return (
    <div style={{textAlign:"center"}}>
      <canvas ref={canvasRef} width={240} height={270}
        style={{display:"block",margin:"0 auto",borderRadius:14,border:"2px solid #6C5CE744",boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}}/>
      {dropping&&<SuspenseBar active duration={6}/>}
      {result&&<ResultBadge name={result} color="#00B894" emoji="⚪"/>}
      <ActionBtn label={dropping?"BÓNG ĐANG RƠI...":"⚪ THẢ BÓNG"} disabled={dropping||!students.length} onClick={drop} color="#00B894"/>
    </div>
  );
}

// ===========================
// MODE: MƯA TÊN (chậm, nền tối)
// ===========================
function RainMode({ students, onResult, soundOn }) {
  const [drops,setDrops]=useState([]);
  const [raining,setRaining]=useState(false);
  const [result,setResult]=useState(null);
  const [highlight,setHighlight]=useState(false);

  const rain=()=>{
    if(raining||!students.length) return;
    setRaining(true);setResult(null);setHighlight(false);
    const win=randItem(students);
    const ds=students.slice(0,14).map((name,i)=>({
      id:i,name,x:3+(i*7)%90,y:-50-Math.random()*140,speed:0.5+Math.random()*0.7,isWinner:name===win
    }));
    setDrops(ds);riseUp(soundOn);
    let c=0;const TOTAL=70;
    const iv=setInterval(()=>{
      c++;
      setDrops(p=>p.map(d=>({...d,y:d.y+d.speed*1.6})));
      if(c%12===0) tensionTick(soundOn,Math.floor(c/18));
      if(c===TOTAL-12){setHighlight(true);heartbeat(soundOn);heartbeat(soundOn);}
      if(c>=TOTAL){clearInterval(iv);setRaining(false);setResult(win);fanfare(soundOn);onResult(win,"Mưa tên");}
    },85);
  };

  return (
    <div>
      <div style={{position:"relative",height:230,
        background:"linear-gradient(180deg,#0a0a1a,#1a2040)",
        borderRadius:12,overflow:"hidden"}}>
        {[...Array(20)].map((_,i)=>(
          <div key={i} style={{position:"absolute",left:`${(i*13)%97}%`,top:`${(i*7)%95}%`,
            width:1.5,height:1.5,borderRadius:"50%",background:"#fff",opacity:0.3}}/>
        ))}
        {drops.map(d=>{
          const hl=d.isWinner&&highlight;
          return (
            <div key={d.id} style={{position:"absolute",left:`${d.x}%`,top:`${Math.min(d.y,215)}px`,
              fontSize:hl?15:10,fontWeight:hl?"900":"400",
              color:hl?"#FFD93D":"rgba(255,255,255,0.65)",
              background:hl?"rgba(255,215,0,0.15)":"transparent",
              padding:hl?"3px 8px":0,borderRadius:6,
              border:hl?"1px solid rgba(255,215,0,0.6)":"none",
              whiteSpace:"nowrap",transition:"top 0.085s linear,color 0.4s",
              boxShadow:hl?"0 0 14px rgba(255,215,0,0.7)":"none",
              zIndex:d.isWinner?10:1,animation:hl?"mysticalPulse 0.6s ease infinite":"none"}}>
              {hl?`⭐ ${d.name} ⭐`:lastName(d.name)}
            </div>
          );
        })}
        {!drops.length&&<div style={{textAlign:"center",paddingTop:90,color:"rgba(255,255,255,0.4)"}}>🌧️ Nhấn để gọi tên!</div>}
      </div>
      {raining&&<SuspenseBar active duration={6}/>}
      {result&&<ResultBadge name={result} color="#74B9FF" emoji="🌧️"/>}
      <ActionBtn label={raining?"🌧️ ĐANG MƯA...":"🌧️ BẮT ĐẦU MƯA"} disabled={raining||!students.length} onClick={rain} color="#0984E3"/>
    </div>
  );
}

// ===========================
// MODE: BẮN BÓNG BÓNG (float animation)
// ===========================
function BalloonMode({ students, onResult, soundOn }) {
  const [balloons,setBalloons]=useState([]);
  const [done,setDone]=useState(false);
  const [result,setResult]=useState(null);
  const [floatT,setFloatT]=useState(0);

  const prepare=useCallback(()=>{
    setDone(false);setResult(null);
    if(!students.length) return;
    const win=randItem(students);
    setBalloons(students.slice(0,8).map((name,i)=>({
      id:i,name,x:8+(i%4)*23+Math.random()*2.5,y:10+Math.floor(i/4)*46,
      color:COLORS[i%COLORS.length],isWinner:name===win,popped:false,phase:Math.random()*Math.PI*2
    })));
    riseUp(soundOn);
  },[students]);
  useEffect(()=>{prepare();},[prepare]);
  useEffect(()=>{
    const iv=setInterval(()=>setFloatT(p=>p+0.05),55);
    return ()=>clearInterval(iv);
  },[]);

  const popIt=id=>{
    if(done) return;
    const b=balloons.find(b=>b.id===id);
    if(!b||b.popped) return;
    balloonPop(soundOn);
    setBalloons(p=>p.map(b=>b.id===id?{...b,popped:true}:b));
    setDone(true);setResult(b.name);fanfare(soundOn);onResult(b.name,"Bắn bóng bóng");
  };

  return (
    <div>
      <div style={{position:"relative",height:225,
        background:"linear-gradient(180deg,#1a0a3e,#3d1a7a,#6c3dc4)",
        borderRadius:12,overflow:"hidden"}}>
        {[15,45,75].map((x,i)=>(
          <div key={i} style={{position:"absolute",top:`${15+i*20}%`,left:`${x}%`,fontSize:18,opacity:0.12}}>☁️</div>
        ))}
        {balloons.map(b=>{
          const fy=Math.sin(floatT+b.phase)*5;
          return (
            <div key={b.id} onClick={()=>!done&&popIt(b.id)}
              style={{position:"absolute",left:`${b.x}%`,top:`calc(${b.y}% + ${fy}px)`,
                cursor:done?"default":"pointer",textAlign:"center",transition:"top 0.06s ease",zIndex:10}}>
              {b.popped?<div style={{fontSize:28}}>💥</div>:<>
                <div style={{fontSize:32,filter:"drop-shadow(0 3px 8px rgba(0,0,0,0.4))",transition:"transform 0.12s",transform:done?"scale(0.9)":"scale(1)"}}>🎈</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.85)",fontWeight:700,textShadow:"0 1px 3px rgba(0,0,0,0.9)",marginTop:-4,whiteSpace:"nowrap"}}>{lastName(b.name)}</div>
              </>}
            </div>
          );
        })}
        {!done&&<div style={{position:"absolute",bottom:10,left:0,right:0,textAlign:"center",color:"rgba(255,255,255,0.6)",fontSize:11,fontWeight:600}}>👆 Chạm vào bóng để nổ!</div>}
      </div>
      {result&&<ResultBadge name={result} color="#FD79A8" emoji="🎈"/>}
      <button onClick={prepare} style={{width:"100%",marginTop:10,padding:"12px",background:"#FD79A8",color:"#fff",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer"}}>🎈 TẠO BÓNG MỚI</button>
    </div>
  );
}

// ===========================
// MODE: MÁY GẮP THÚ (chậm, kịch tính)
// ===========================
function ClawMode({ students, onResult, soundOn }) {
  const [phase,setPhase]=useState("idle");
  const [clawX,setClawX]=useState(50);
  const [clawH,setClawH]=useState(14);
  const [grabbed,setGrabbed]=useState(null);
  const [result,setResult]=useState(null);

  const operate=()=>{
    if(phase!=="idle"||!students.length) return;
    const win=randItem(students);
    const tx=14+Math.random()*72;
    setGrabbed(null);setResult(null);setPhase("moving");
    riseUp(soundOn);
    let px=50,step=0;
    const moveIv=setInterval(()=>{
      step++;px+=(tx-px)*0.08;setClawX(px);
      if(step%10===0) tensionTick(soundOn,0);
      if(step>=50){
        clearInterval(moveIv);setPhase("descend");
        let h=14,ds=0;
        const dIv=setInterval(()=>{
          ds++;h=Math.min(h+2,82);setClawH(h);
          tensionTick(soundOn,ds>18?2:1);
          if(ds>=32){
            clearInterval(dIv);setPhase("grab");
            heartbeat(soundOn);heartbeat(soundOn);
            setTimeout(()=>{
              setGrabbed(win);setPhase("ascend");
              let ah=82,as=0;
              const uIv=setInterval(()=>{
                as++;ah=Math.max(ah-2.8,14);setClawH(ah);
                setClawX(p=>p+(50-p)*0.08);
                if(as%7===0) tensionTick(soundOn,1);
                if(as>=26){clearInterval(uIv);setPhase("done");setResult(win);fanfare(soundOn);onResult(win,"Máy gắp thú");}
              },65);
            },700);
          }
        },58);
      }
    },48);
  };

  const prizes=students.slice(0,6);
  const labels={idle:"🪝 VẬN HÀNH MÁY",moving:"🔄 ĐANG DI CHUYỂN...",descend:"⬇️ ĐANG HẠ XUỐNG...",grab:"🪝 ĐANG GẮP...",ascend:"⬆️ ĐANG KÉO LÊN...",done:"🪝 CHƠI LẠI"};

  return (
    <div style={{textAlign:"center"}}>
      <div style={{position:"relative",height:240,background:"linear-gradient(180deg,#1a1a2e,#16213e)",borderRadius:12,overflow:"hidden",border:"2px solid #FDCB6E44"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:9,background:"linear-gradient(90deg,#777,#ccc,#aaa,#ccc,#777)",zIndex:5}}/>
        <div style={{position:"absolute",top:0,left:`${clawX}%`,transform:"translateX(-50%)",zIndex:10}}>
          <div style={{width:3,height:`${clawH}px`,background:"linear-gradient(180deg,#999,#ddd)",margin:"0 auto"}}/>
          <div style={{fontSize:28,marginTop:-4,filter:"drop-shadow(0 2px 10px rgba(0,0,0,0.7))",textAlign:"center"}}>🪝</div>
          {grabbed&&<div style={{marginTop:4,background:"rgba(253,203,110,0.92)",borderRadius:8,padding:"2px 7px",fontSize:10,fontWeight:700,whiteSpace:"nowrap",color:"#333",boxShadow:"0 2px 8px rgba(0,0,0,0.3)"}}>{lastName(grabbed)}</div>}
        </div>
        {prizes.map((name,i)=>(
          <div key={i} style={{position:"absolute",left:`${10+(i%3)*30}%`,bottom:`${12+Math.floor(i/3)*38}%`,textAlign:"center"}}>
            <div style={{fontSize:28}}>🧸</div>
            <div style={{fontSize:8,color:"#888",marginTop:2}}>{lastName(name)}</div>
          </div>
        ))}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:16,background:"linear-gradient(0deg,#FDCB6E44,transparent)",borderTop:"2px solid #FDCB6E55"}}/>
        {phase!=="idle"&&phase!=="done"&&(
          <div style={{position:"absolute",top:14,right:10,background:"rgba(0,0,0,0.65)",
            borderRadius:8,padding:"3px 9px",fontSize:10,color:"#FDCB6E",fontWeight:700}}>
            <Pulse active={phase==="grab"}/>{phase.toUpperCase()}
          </div>
        )}
      </div>
      {phase!=="idle"&&phase!=="done"&&<SuspenseBar active duration={7}/>}
      {result&&phase==="done"&&<ResultBadge name={result} color="#FDCB6E" emoji="🪝" textDark/>}
      <ActionBtn label={labels[phase]} disabled={phase!=="idle"&&phase!=="done"||!students.length}
        onClick={()=>{if(phase==="done"){setPhase("idle");setResult(null);setGrabbed(null);}else operate();}}
        color="#FDCB6E" textDark/>
    </div>
  );
}

// ===========================
// MODE: THƯ BÍ ẨN (3s shimmer)
// ===========================
function LetterMode({ students, onResult, soundOn }) {
  const [phase,setPhase]=useState("idle");
  const [result,setResult]=useState(null);
  const [glow,setGlow]=useState(0);

  const open=()=>{
    if((phase!=="idle"&&phase!=="done")||!students.length) return;
    const win=randItem(students);
    setPhase("shimmer");setResult(null);riseUp(soundOn);
    let s=0;
    const sv=setInterval(()=>{
      s+=0.12;setGlow(Math.sin(s*2.5)*0.5+0.5);
      if(s%1.2<0.15) tensionTick(soundOn,s>3?3:s>2?2:1);
      if(s>3.8){
        clearInterval(sv);setGlow(1);setPhase("open");
        setTimeout(()=>{setPhase("done");setResult(win);fanfare(soundOn);onResult(win,"Thư bí ẩn");},1100);
      }
    },100);
  };

  return (
    <div style={{textAlign:"center"}}>
      <div style={{position:"relative",display:"inline-block",marginBottom:12,cursor:"pointer"}} onClick={open}>
        <div style={{fontSize:phase==="done"?95:phase==="shimmer"?75:68,
          transition:"font-size 0.5s,filter 0.2s",marginBottom:8,
          filter:phase==="shimmer"?`drop-shadow(0 0 ${glow*20}px rgba(232,67,147,0.9))`
            :phase==="done"?"drop-shadow(0 0 18px rgba(232,67,147,0.65))":"none"}}>
          {phase==="done"?"📬":phase==="open"?"📩":"💌"}
        </div>
        {phase==="shimmer"&&(
          <div style={{position:"absolute",inset:-10,borderRadius:18,
            border:`2px solid rgba(232,67,147,${glow*0.85})`,
            boxShadow:`0 0 ${glow*24}px rgba(232,67,147,0.45)`,
            animation:"mysticalPulse 0.55s ease infinite",pointerEvents:"none"}}/>
        )}
      </div>
      {phase==="shimmer"&&<div style={{color:"#E84393",fontSize:12,fontWeight:700,marginBottom:6,animation:"mysticalPulse 0.8s ease infinite"}}>💌 Thư đang được viết bí ẩn...</div>}
      {phase==="shimmer"&&<SuspenseBar active duration={3.8}/>}
      {phase==="done"&&result&&(
        <div style={{background:"linear-gradient(135deg,#ffecd2,#fcb69f)",borderRadius:14,
          padding:"16px 22px",margin:"0 auto 10px",maxWidth:260,
          boxShadow:"0 8px 26px rgba(232,67,147,0.28)",animation:"popIn 0.55s ease"}}>
          <div style={{fontSize:11,color:"#E84393",marginBottom:6,fontWeight:700}}>💌 Người được chọn:</div>
          <div style={{fontSize:22,fontWeight:800,color:"#333"}}>{result}</div>
        </div>
      )}
      {phase==="done"&&result&&<ResultBadge name={result} color="#E84393" emoji="💌"/>}
      <ActionBtn
        label={phase==="idle"?"💌 MỞ THƯ BÍ ẨN":phase==="shimmer"?"✍️ ĐANG VIẾT THƯ...":phase==="open"?"📩 ĐANG MỞ...":"💌 MỞ THƯ MỚI"}
        disabled={(phase!=="idle"&&phase!=="done")||!students.length}
        onClick={open} color="#E84393"/>
    </div>
  );
}

// ===========================
// MAIN APP
// ===========================
export default function App() {
  const [students,setStudents]=useState([]);
  const [selectedMode,setSelectedMode]=useState(null);
  const [history,setHistory]=useState([]);
  const [darkMode,setDarkMode]=useState(false);
  const [soundOn,setSoundOn]=useState(true);
  const [inputText,setInputText]=useState("");
  const [log,setLog]=useState(["> HỆ THỐNG SẴN SÀNG","> AUDIO: ĐÃ KẾT NỐI","> NHẠC NỀN: TẮT"]);

  const addLog=msg=>setLog(p=>[...p.slice(-6),`> ${msg}`]);
  const T={
    bg:darkMode?"#0f0f1a":"#f0f4f8",card:darkMode?"#1a1a2e":"#fff",
    text:darkMode?"#e8e8f0":"#1a202c",sub:darkMode?"#8888a8":"#718096",
    border:darkMode?"#2a2a4a":"#e2e8f0",inputBg:darkMode?"#0f0f1a":"#f7fafc"
  };

  const updateStudents=()=>{
    const names=inputText.split("\n").map(n=>n.trim()).filter(n=>n.length>0);
    setStudents(names);addLog(`ĐÃ TẢI: ${names.length} HỌC SINH`);
  };
  const loadSample=()=>{setInputText(SAMPLE.join("\n"));setStudents(SAMPLE);addLog("ĐÃ NẠP DỮ LIỆU MẪU (20 HS)");};
  const clearAll=()=>{setStudents([]);setInputText("");addLog("ĐÃ XÓA DANH SÁCH");};
  const handleFile=e=>{
    const f=e.target.files[0];if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{const names=ev.target.result.split("\n").map(n=>n.trim()).filter(n=>n.length>0);setInputText(names.join("\n"));setStudents(names);addLog(`FILE: ${names.length} HỌC SINH`);};
    r.readAsText(f);
  };
  const onResult=(name,mode)=>{
    setHistory(p=>[{name,mode,time:new Date().toLocaleTimeString("vi-VN")},...p].slice(0,20));
    addLog(`GỌI: ${name} [${mode}]`);
  };
  const renderMode=()=>{
    const map={wheel:WheelMode,duck:DuckMode,jackpot:JackpotMode,bomb:BombMode,dice:DiceMode,
      dart:DartMode,tarot:TarotMode,plinko:PlinkoMode,rain:RainMode,balloon:BalloonMode,claw:ClawMode,letter:LetterMode};
    const C=map[selectedMode];
    return C?<C students={students} onResult={onResult} soundOn={soundOn}/>:null;
  };

  return (
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"'Segoe UI',Tahoma,sans-serif",color:T.text,paddingBottom:40}}>
      <style>{`
        @keyframes popIn{0%{transform:scale(0.55);opacity:0}65%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes heartPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.55);opacity:0.65}}
        @keyframes countdown{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
        @keyframes bombShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
        @keyframes bombExplode{0%{transform:scale(1)}40%{transform:scale(1.6)}100%{transform:scale(1)}}
        @keyframes mysticalPulse{0%,100%{opacity:0.55;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
        @keyframes dartFly2{0%{transform:translateY(-50%) rotate(-12deg);left:-5%}100%{transform:translateY(-50%) rotate(-12deg);left:65%}}
        @keyframes dartHit{0%{transform:translate(-50%,-50%) scale(0.05);opacity:0}70%{transform:translate(-50%,-50%) scale(1.45)}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
        @keyframes diceSpin{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
        @keyframes reelSpin{0%,100%{opacity:1;transform:scaleY(1)}50%{opacity:0.2;transform:scaleY(0.6)}}
        *{box-sizing:border-box;} button:hover:not(:disabled){filter:brightness(0.9);} textarea:focus{outline:none;border-color:#3b82f6!important;}
      `}</style>

      {/* HEADER */}
      <div style={{background:T.card,padding:"18px 16px 14px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#FF6B6B",animation:"heartPulse 1.5s infinite"}}/>
          <span style={{fontSize:10,color:"#3b82f6",fontWeight:700,letterSpacing:2}}>HỆ THỐNG GỌI TÊN</span>
        </div>
        <div style={{fontSize:21,fontWeight:900,letterSpacing:0.5,marginBottom:4}}>🎯 12 CHẾ ĐỘ NGẪU NHIÊN</div>
        <div style={{fontSize:10,color:T.sub}}>Phát triển bởi <b>Cô Huỳnh Thị Thùy Dương</b> — <span style={{color:"#3b82f6"}}>THCS Lý Tự Trọng, Tây Ninh</span></div>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={()=>setDarkMode(!darkMode)} style={{flex:1,padding:"9px",background:T.inputBg,color:T.text,border:`1px solid ${T.border}`,borderRadius:12,fontSize:11,fontWeight:600,cursor:"pointer"}}>{darkMode?"🌙 TỐI":"☀️ SÁNG"}</button>
          <button onClick={()=>setSoundOn(!soundOn)} style={{flex:1,padding:"9px",background:soundOn?"#E3F2FD":T.inputBg,color:soundOn?"#1565C0":T.text,border:`1px solid ${T.border}`,borderRadius:12,fontSize:11,fontWeight:600,cursor:"pointer"}}>{soundOn?"🔊 ÂM THANH: ON":"🔇 ÂM THANH: OFF"}</button>
        </div>
      </div>

      <div style={{padding:"0 12px"}}>
        {/* STUDENT LIST */}
        <div style={{background:T.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span>📋</span><span style={{fontSize:11,fontWeight:700,color:"#3b82f6",letterSpacing:1}}>DANH SÁCH LỚP</span>
            </div>
            <div style={{background:"#E3F2FD",color:"#1565C0",padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>{students.length} HS</div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <label style={{flex:1,padding:"10px",background:"#E3F2FD",color:"#1565C0",border:"none",borderRadius:12,fontSize:12,fontWeight:700,cursor:"pointer",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
              <input type="file" accept=".txt,.csv" onChange={handleFile} style={{display:"none"}}/>⬆️ TẢI FILE
            </label>
            <button onClick={loadSample} style={{flex:1,padding:"10px",background:T.inputBg,color:T.text,border:`1px solid ${T.border}`,borderRadius:12,fontSize:12,fontWeight:700,cursor:"pointer"}}>🔀 MẪU</button>
            <button onClick={clearAll} style={{flex:1,padding:"10px",background:"#FFEBEE",color:"#C62828",border:"none",borderRadius:12,fontSize:12,fontWeight:700,cursor:"pointer"}}>🗑️ XÓA</button>
          </div>
          <textarea value={inputText} onChange={e=>setInputText(e.target.value)}
            placeholder="Dán danh sách học sinh ở đây (mỗi dòng 1 tên)..." rows={4}
            style={{width:"100%",padding:"10px 12px",background:T.inputBg,color:T.text,border:`1px solid ${T.border}`,borderRadius:12,fontSize:13,resize:"vertical",fontFamily:"inherit"}}/>
          <button onClick={updateStudents} style={{width:"100%",marginTop:8,padding:"12px",background:"#E3F2FD",color:"#1565C0",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:1}}>CẬP NHẬT DANH SÁCH</button>
        </div>

        {/* MODE SELECTOR */}
        <div style={{background:T.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
            <span>🎮</span><span style={{fontSize:11,fontWeight:700,color:"#3b82f6",letterSpacing:1}}>CHỌN CHẾ ĐỘ TƯƠNG TÁC (12)</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {MODES.map(m=>(
              <button key={m.id} onClick={()=>setSelectedMode(selectedMode===m.id?null:m.id)}
                style={{padding:"16px 8px",background:selectedMode===m.id?"#E8F4FD":T.inputBg,
                  border:selectedMode===m.id?"2px solid #3b82f6":`1px solid ${T.border}`,
                  borderRadius:16,cursor:"pointer",textAlign:"center",transition:"all 0.2s",
                  boxShadow:selectedMode===m.id?"0 4px 16px rgba(59,130,246,0.22)":"none"}}>
                <div style={{fontSize:34,marginBottom:6}}>{m.emoji}</div>
                <div style={{fontSize:10,fontWeight:800,color:T.text,letterSpacing:0.4,whiteSpace:"pre-line",lineHeight:1.4}}>{m.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* MODE PANEL */}
        {selectedMode&&(
          <div style={{background:T.card,borderRadius:16,padding:16,marginBottom:10,border:"2px solid #3b82f6",boxShadow:"0 4px 22px rgba(59,130,246,0.12)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontWeight:800,color:"#3b82f6",fontSize:14}}>
                {MODES.find(m=>m.id===selectedMode)?.emoji} {MODES.find(m=>m.id===selectedMode)?.name.replace("\n"," ")}
              </span>
              <button onClick={()=>setSelectedMode(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:T.sub}}>✕</button>
            </div>
            {!students.length
              ?<div style={{textAlign:"center",padding:"24px",color:T.sub}}>⚠️ Vui lòng thêm danh sách học sinh trước!</div>
              :renderMode()
            }
          </div>
        )}

        {/* HISTORY */}
        <div style={{background:T.card,borderRadius:16,padding:16,marginBottom:10,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span>🕐</span><span style={{fontSize:11,fontWeight:700,color:"#3b82f6",letterSpacing:1}}>LỊCH SỬ GỌI</span>
            </div>
            <button onClick={()=>setHistory([])} style={{background:"none",border:"none",color:"#3b82f6",fontSize:11,cursor:"pointer",fontWeight:600}}>XÓA</button>
          </div>
          <div style={{background:T.inputBg,borderRadius:10,padding:"10px 12px",minHeight:64,fontFamily:"monospace",fontSize:11,color:T.sub}}>
            {!history.length?<><div>&gt; CHƯA CÓ DỮ LIỆU</div><div>&gt; ĐANG CHỜ...</div></>
            :history.slice(0,6).map((h,i)=>(
              <div key={i} style={{color:i===0?"#4CAF50":T.sub,marginBottom:2}}>&gt; [{h.time}] {h.name} — {h.mode}</div>
            ))}
          </div>
        </div>

        {/* LOG */}
        <div style={{background:T.inputBg,borderRadius:12,padding:"10px 12px",border:`1px solid ${T.border}`,fontFamily:"monospace",fontSize:10}}>
          {log.map((l,i)=>(
            <div key={i} style={{color:i===log.length-1?"#3b82f6":T.sub}}>{l}</div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:16,fontSize:10,color:T.sub}}>
          Cô Huỳnh Thị Thùy Dương • THCS Lý Tự Trọng, Tây Ninh<br/>🎯 Hệ Thống Gọi Tên 12 Chế Độ Ngẫu Nhiên
        </div>
      </div>
    </div>
  );
}
