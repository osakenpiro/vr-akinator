import { useState, useMemo } from 'react'

/* ═══ 20 Visualization Methods ═══ */
const METHODS = [
  { id:'list',      name:'リスト',           emoji:'📃', family:'順序',    implemented:false, url:null },
  { id:'tree',      name:'ツリー',           emoji:'🌳', family:'階層',    implemented:false, url:null },
  { id:'wakka',     name:'わっかずかん',     emoji:'🪐', family:'分類',    implemented:true,  url:'https://osakenpiro.github.io/wakkazukan/' },
  { id:'banet',     name:'バネットマップ',   emoji:'🌀', family:'関係',    implemented:true,  url:'https://osakenpiro.github.io/banet-map/' },
  { id:'tier',      name:'たなずかん (Tier表)', emoji:'📚', family:'ランク',  implemented:true,  url:'https://osakenpiro.github.io/tana-zukan/' },
  { id:'hyakumasu', name:'百ますグリッド',   emoji:'🔢', family:'全ペア',  implemented:true,  url:'https://osakenpiro.github.io/hyakumasu/' },
  { id:'timeline',  name:'タイムライン',     emoji:'📅', family:'時間',    implemented:false, url:null },
  { id:'geo',       name:'地理マップ',       emoji:'🗺️', family:'空間',    implemented:false, url:null },
  { id:'venn',      name:'ベン図',           emoji:'⊕',  family:'集合',    implemented:false, url:null },
  { id:'sankey',    name:'サンキー',         emoji:'🌊', family:'流量',    implemented:false, url:null },
  { id:'radar',     name:'レーダーチャート', emoji:'🎯', family:'多属性',  implemented:false, url:null },
  { id:'heatmap',   name:'ヒートマップ',     emoji:'🔥', family:'密度',    implemented:false, url:null },
  { id:'bubble',    name:'バブル',           emoji:'🫧', family:'3値',    implemented:false, url:null },
  { id:'waterfall', name:'ウォーターフォール', emoji:'💧', family:'累積',   implemented:false, url:null },
  { id:'kanban',    name:'カンバン',         emoji:'🗂️', family:'状態',    implemented:false, url:null },
  { id:'chord',     name:'弦図',             emoji:'🎻', family:'関係',    implemented:false, url:null },
  { id:'trellis',   name:'トレリス',         emoji:'🪟', family:'並列',    implemented:false, url:null },
  { id:'parallel',  name:'平行座標',         emoji:'||', family:'多次元',  implemented:false, url:null },
  { id:'treemap',   name:'ツリーマップ',     emoji:'🗺', family:'階層',    implemented:false, url:null },
  { id:'scatter',   name:'散布図',           emoji:'∴',  family:'相関',    implemented:false, url:null },
]
const METHOD_BY_ID = Object.fromEntries(METHODS.map(m => [m.id, m]))

/* ═══ 5 Questions ═══ */
const QUESTIONS = [
  {
    id:'Q1', title:'データの主役は何？',
    subtitle:'いちばん見たいのは、どの「かたち」？',
    options:[
      { id:'sorting',     label:'仕分け',        desc:'モノをカテゴリに分けて並べたい',    emoji:'📦' },
      { id:'relations',   label:'関係',          desc:'モノとモノのつながりを見たい',      emoji:'🕸️' },
      { id:'pairs',       label:'全ペア比較',    desc:'A×Bの全組み合わせを見たい',         emoji:'⚔️' },
      { id:'rank',        label:'順序・ランク',  desc:'強さや優先度で並べたい',            emoji:'🏆' },
      { id:'spacetime',   label:'空間・時間',    desc:'いつ/どこで起きたかを見たい',       emoji:'🌌' },
    ],
  },
  {
    id:'Q2', title:'データの量は？',
    subtitle:'だいたいいくつ？',
    options:[
      { id:'few',    label:'少ない',  desc:'〜20ぐらい',   emoji:'🌱' },
      { id:'mid',    label:'中ぐらい', desc:'20〜200',     emoji:'🌳' },
      { id:'many',   label:'多い',    desc:'200以上',     emoji:'🌲' },
    ],
  },
  {
    id:'Q3', title:'カテゴリの構造は？',
    subtitle:'分類同士の関係',
    options:[
      { id:'hierarchy', label:'階層あり',  desc:'親子・入れ子構造',        emoji:'🗂️' },
      { id:'overlap',   label:'重なりあり', desc:'同じ物が複数カテゴリに',  emoji:'⊕' },
      { id:'flat',      label:'フラット',   desc:'対等・タグ的',            emoji:'📑' },
      { id:'ordered',   label:'順序のみ',   desc:'並び順に意味がある',      emoji:'📊' },
    ],
  },
  {
    id:'Q4', title:'どの粒度で見たい？',
    subtitle:'ズームの深さ',
    options:[
      { id:'individual', label:'個別',       desc:'1つ1つを丁寧に',         emoji:'🔎' },
      { id:'group',      label:'グループ',   desc:'塊ごとの比較',           emoji:'🔍' },
      { id:'pattern',    label:'全体パターン', desc:'俯瞰・密度・傾向',     emoji:'🔭' },
    ],
  },
  {
    id:'Q5', title:'最終的に何をしたい？',
    subtitle:'目的',
    options:[
      { id:'discover',   label:'発見',           desc:'新しい関係を見つける',   emoji:'💡' },
      { id:'organize',   label:'整理',           desc:'散らかったものを配置する', emoji:'🧹' },
      { id:'evaluate',   label:'評価',           desc:'ランク付け・比較',       emoji:'⚖️' },
      { id:'navigate',   label:'ナビゲーション', desc:'目的地まで辿り着く',     emoji:'🧭' },
    ],
  },
]

/* ═══ Scoring Matrix ═══
   各回答がどの手法にどれだけ "効く" か (0.0 ~ 1.0)
*/
const WEIGHTS = {
  'Q1:sorting':    { wakka:0.9, tree:0.8, tier:0.6, venn:0.5, treemap:0.5, list:0.4, kanban:0.3 },
  'Q1:relations':  { banet:0.95, sankey:0.8, chord:0.7, tree:0.4, scatter:0.3 },
  'Q1:pairs':      { hyakumasu:0.95, heatmap:0.85, chord:0.5, parallel:0.5 },
  'Q1:rank':       { tier:0.9, list:0.6, waterfall:0.5, kanban:0.4, radar:0.3 },
  'Q1:spacetime':  { timeline:0.9, geo:0.9, scatter:0.5, waterfall:0.3 },

  'Q2:few':        { list:0.4, radar:0.5, venn:0.5, tree:0.3, kanban:0.3, chord:0.3 },
  'Q2:mid':        { wakka:0.5, tier:0.4, hyakumasu:0.4, banet:0.5, tree:0.3, kanban:0.3 },
  'Q2:many':       { heatmap:0.6, treemap:0.5, bubble:0.4, scatter:0.4, parallel:0.3 },

  'Q3:hierarchy':  { tree:0.9, treemap:0.7, wakka:0.5, kanban:0.2 },
  'Q3:overlap':    { venn:0.95, wakka:0.5, chord:0.4 },
  'Q3:flat':       { tier:0.3, list:0.4, hyakumasu:0.3, heatmap:0.3, kanban:0.4, trellis:0.4 },
  'Q3:ordered':    { tier:0.6, timeline:0.5, list:0.4, waterfall:0.4, sankey:0.3 },

  'Q4:individual': { list:0.4, radar:0.6, trellis:0.3, wakka:0.3 },
  'Q4:group':      { tier:0.4, kanban:0.5, treemap:0.4, trellis:0.5, venn:0.4 },
  'Q4:pattern':    { heatmap:0.7, hyakumasu:0.5, scatter:0.5, parallel:0.5, bubble:0.4, banet:0.4 },

  'Q5:discover':   { banet:0.6, scatter:0.5, chord:0.4, bubble:0.3 },
  'Q5:organize':   { kanban:0.5, tier:0.4, list:0.3, tree:0.3, wakka:0.4 },
  'Q5:evaluate':   { tier:0.5, radar:0.5, hyakumasu:0.4, waterfall:0.3, heatmap:0.3, parallel:0.3 },
  'Q5:navigate':   { list:0.4, tree:0.5, wakka:0.4, treemap:0.4, timeline:0.3 },
}

/* ═══ Scoring Function ═══ */
function scoreMethods(answers) {
  // answers: {Q1: 'sorting', Q2: 'mid', ...}
  const scores = Object.fromEntries(METHODS.map(m => [m.id, 0]))
  Object.entries(answers).forEach(([q, a]) => {
    const key = `${q}:${a}`
    const weights = WEIGHTS[key] || {}
    Object.entries(weights).forEach(([methodId, w]) => {
      if (scores[methodId] !== undefined) scores[methodId] += w
    })
  })
  // Normalize by max
  const max = Math.max(...Object.values(scores), 0.01)
  const normalized = Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, max > 0 ? v / max : 0])
  )
  return { raw: scores, normalized }
}

/* ═══ Main Component ═══ */
export default function VRAkinator() {
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(0) // 0..5 (5 = result)
  const [showAll, setShowAll] = useState(false)

  const totalSteps = QUESTIONS.length
  const progress = step / totalSteps

  const select = (qId, optId) => {
    setAnswers(prev => ({ ...prev, [qId]: optId }))
    setTimeout(() => setStep(s => s + 1), 250)
  }

  const restart = () => { setAnswers({}); setStep(0); setShowAll(false) }
  const back = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const { normalized } = useMemo(() => scoreMethods(answers), [answers])

  // Sorted recommendation
  const ranked = useMemo(() => {
    return METHODS
      .map(m => ({ ...m, score: normalized[m.id] || 0 }))
      .sort((a, b) => b.score - a.score)
  }, [normalized])

  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3)
  const isResult = step >= totalSteps

  return (
    <div style={{
      minHeight:'100vh',background:'#0b0f1a',color:'#e4e8f0',
      display:'flex',flexDirection:'column',
    }}>
      {/* Header */}
      <header style={{
        padding:'12px 18px',borderBottom:'1px solid #1e2640',
        display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',
      }}>
        <div style={{fontSize:20,fontWeight:700}}>🧙 VR Akinator</div>
        <div style={{fontSize:11,color:'#5a6378'}}>可視化の魔神 · 5問で最適なVRを占う</div>

        {/* Progress */}
        <div style={{flex:1,minWidth:120,height:4,background:'#111827',borderRadius:2,overflow:'hidden',margin:'0 12px'}}>
          <div style={{
            width:`${progress*100}%`,height:'100%',
            background:'linear-gradient(90deg,#ffd166,#ef476f)',
            transition:'width 0.4s',
          }}/>
        </div>
        <span style={{fontSize:11,color:'#8892b0',minWidth:36}}>
          {isResult ? '占結果' : `${step+1}/${totalSteps}`}
        </span>

        <div style={{display:'flex',gap:8,fontSize:10}}>
          <a href="https://osakenpiro.github.io/wakkazukan/" target="_blank" rel="noreferrer"
            style={{color:'#8892b0',textDecoration:'none'}}>🪐</a>
          <a href="https://osakenpiro.github.io/banet-map/" target="_blank" rel="noreferrer"
            style={{color:'#8892b0',textDecoration:'none'}}>🌀</a>
          <a href="https://osakenpiro.github.io/tana-zukan/" target="_blank" rel="noreferrer"
            style={{color:'#8892b0',textDecoration:'none'}}>📚</a>
          <a href="https://osakenpiro.github.io/hyakumasu/" target="_blank" rel="noreferrer"
            style={{color:'#8892b0',textDecoration:'none'}}>🔢</a>
        </div>
      </header>

      {/* Body */}
      <main style={{flex:1,padding:'24px 20px',maxWidth:720,margin:'0 auto',width:'100%'}}>
        {!isResult && step < QUESTIONS.length && (
          <Question
            q={QUESTIONS[step]}
            selectedOpt={answers[QUESTIONS[step].id]}
            onSelect={opt => select(QUESTIONS[step].id, opt)}
            onBack={step > 0 ? back : null}
          />
        )}
        {isResult && (
          <Result
            top3={top3} rest={rest} answers={answers}
            showAll={showAll} onToggleAll={() => setShowAll(!showAll)}
            onRestart={restart} onBack={back}
          />
        )}
      </main>

      <footer style={{
        padding:'10px 16px',borderTop:'1px solid #1e2640',display:'flex',
        alignItems:'center',gap:16,fontSize:10,color:'#5a6378',
      }}>
        <span>Boolean → Float 推薦</span>
        <span>20手法から探す</span>
        <span style={{color:'#ffd166'}}>VR 検索柱 L1</span>
        <a href="https://github.com/osakenpiro/vr-akinator" target="_blank" rel="noreferrer"
          style={{marginLeft:'auto',color:'#5a6378',textDecoration:'none'}}>GitHub</a>
      </footer>
    </div>
  )
}

/* ═══ Question View ═══ */
function Question({ q, selectedOpt, onSelect, onBack }) {
  return (
    <div>
      <div style={{fontSize:12,color:'#5a6378',marginBottom:4}}>{q.id}</div>
      <h2 style={{fontSize:24,fontWeight:900,margin:'0 0 6px 0'}}>{q.title}</h2>
      <div style={{fontSize:13,color:'#8892b0',marginBottom:20}}>{q.subtitle}</div>

      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10}}>
        {q.options.map(opt => {
          const sel = selectedOpt === opt.id
          return (
            <button key={opt.id} onClick={() => onSelect(opt.id)}
              style={{
                textAlign:'left',padding:'14px 18px',
                background: sel ? '#ffd16622' : '#111827',
                border: sel ? '2px solid #ffd166' : '1px solid #1e2640',
                borderRadius:12,cursor:'pointer',display:'flex',alignItems:'center',gap:14,
                color:'#e4e8f0',transition:'all .15s',
              }}
              onMouseEnter={e => { if(!sel) e.currentTarget.style.borderColor = '#5a6378' }}
              onMouseLeave={e => { if(!sel) e.currentTarget.style.borderColor = '#1e2640' }}
            >
              <span style={{fontSize:28,minWidth:36}}>{opt.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:700}}>{opt.label}</div>
                <div style={{fontSize:11,color:'#8892b0',marginTop:2}}>{opt.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      {onBack && (
        <div style={{marginTop:24}}>
          <button onClick={onBack} style={{
            background:'none',border:'none',color:'#5a6378',fontSize:12,cursor:'pointer',
          }}>← 前の質問</button>
        </div>
      )}
    </div>
  )
}

/* ═══ Result View ═══ */
function Result({ top3, rest, answers, showAll, onToggleAll, onRestart, onBack }) {
  return (
    <div>
      <div style={{fontSize:12,color:'#5a6378',marginBottom:4}}>占結果</div>
      <h2 style={{fontSize:24,fontWeight:900,margin:'0 0 6px 0'}}>
        あなたにぴったりの可視化は…
      </h2>
      <div style={{fontSize:12,color:'#8892b0',marginBottom:20}}>
        Float推薦 — スコアが高い順に3つ
      </div>

      {/* TOP 3 */}
      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
        {top3.map((m, i) => <ResultCard key={m.id} m={m} rank={i+1} />)}
      </div>

      {/* Show all */}
      <button onClick={onToggleAll} style={{
        width:'100%',padding:'8px',background:'#111827',border:'1px solid #1e2640',
        borderRadius:8,color:'#8892b0',fontSize:11,cursor:'pointer',marginBottom:12,
      }}>
        {showAll ? '▲ 上位3つだけ表示' : `▼ 残り${rest.length}手法のスコアも見る`}
      </button>

      {showAll && (
        <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:20}}>
          {rest.map(m => (
            <div key={m.id} style={{
              padding:'7px 12px',background:'#0d1320',border:'1px solid #1e264055',
              borderRadius:6,display:'flex',alignItems:'center',gap:10,fontSize:11,
              opacity: m.score > 0 ? 1 : 0.5,
            }}>
              <span style={{fontSize:14}}>{m.emoji}</span>
              <span style={{fontWeight:600,minWidth:120}}>{m.name}</span>
              <span style={{color:'#5a6378',fontSize:10}}>{m.family}</span>
              <div style={{flex:1,height:3,background:'#1e2640',borderRadius:2,margin:'0 8px'}}>
                <div style={{width:`${m.score*100}%`,height:'100%',background:'#5a6378',borderRadius:2}}/>
              </div>
              <span style={{color:'#8892b0',minWidth:36,textAlign:'right'}}>
                {(m.score * 100).toFixed(0)}%
              </span>
              {m.implemented && <span style={{fontSize:8,color:'#06d6a0'}}>●</span>}
            </div>
          ))}
        </div>
      )}

      <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:16}}>
        <button onClick={onBack} style={{
          padding:'8px 18px',background:'#1e2640',color:'#c4c9d4',
          border:'none',borderRadius:8,fontSize:12,cursor:'pointer',
        }}>← 質問に戻る</button>
        <button onClick={onRestart} style={{
          padding:'8px 18px',background:'#ffd166',color:'#0b0f1a',
          border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',
        }}>🔮 もう一度占う</button>
      </div>
    </div>
  )
}

/* ═══ Result Card (for TOP3) ═══ */
function ResultCard({ m, rank }) {
  const medal = rank===1?'🥇':rank===2?'🥈':'🥉'
  const accent = rank===1?'#ffd166':rank===2?'#8892b0':'#b8a038'
  return (
    <div style={{
      padding:'16px 20px',background:`${accent}0a`,border:`2px solid ${accent}`,
      borderRadius:14,display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',
      boxShadow: rank===1 ? `0 0 24px ${accent}33` : undefined,
    }}>
      <div style={{fontSize:28,minWidth:40}}>{medal}</div>
      <div style={{fontSize:32,minWidth:40}}>{m.emoji}</div>
      <div style={{flex:1,minWidth:180}}>
        <div style={{fontSize:18,fontWeight:900,color:accent}}>{m.name}</div>
        <div style={{fontSize:11,color:'#8892b0',marginTop:2}}>
          系統: {m.family} · 適合度 {(m.score * 100).toFixed(0)}%
        </div>
      </div>

      {m.implemented ? (
        <a href={m.url} target="_blank" rel="noreferrer" style={{
          padding:'10px 20px',background:accent,color:'#0b0f1a',
          textDecoration:'none',borderRadius:10,fontSize:13,fontWeight:700,
          whiteSpace:'nowrap',
        }}>開く →</a>
      ) : (
        <div style={{
          padding:'10px 18px',background:'#1e2640',color:'#5a6378',
          borderRadius:10,fontSize:11,fontWeight:600,whiteSpace:'nowrap',
        }}>Coming Soon</div>
      )}

      {/* Progress bar */}
      <div style={{width:'100%',height:5,background:'#1e2640',borderRadius:3,marginTop:4}}>
        <div style={{
          width:`${m.score*100}%`,height:'100%',background:accent,borderRadius:3,
          transition:'width 0.6s',
        }}/>
      </div>
    </div>
  )
}
