const {compactNumber}=require('../services/numberFormat');
const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,StringSelectMenuBuilder,ModalBuilder,TextInputBuilder,TextInputStyle}=require('discord.js');const M=require('../services/marketService');const {mtx}=require('../services/i18n');
const S={title:{en:'📈 Corgi Market • Virtual Market',vi:'📈 Corgi Market • Thị trường mô phỏng','pt-BR':'📈 Corgi Market • Mercado virtual','pt-PT':'📈 Corgi Market • Mercado virtual',es:'📈 Corgi Market • Mercado virtual',fr:'📈 Corgi Market • Marché virtuel',de:'📈 Corgi Market • Virtueller Markt',ja:'📈 Corgi Market • 仮想市場',ko:'📈 Corgi Market • 가상 시장',id:'📈 Corgi Market • Pasar virtual','zh-TW':'📈 Corgi Market • 虛擬市場','zh-CN':'📈 Corgi Market • 虚拟市场'},buy:{en:'Buy',vi:'Mua','pt-BR':'Comprar','pt-PT':'Comprar',es:'Comprar',fr:'Acheter',de:'Kaufen',ja:'購入',ko:'매수',id:'Beli','zh-TW':'買入','zh-CN':'买入'},sell:{en:'Sell',vi:'Bán','pt-BR':'Vender','pt-PT':'Vender',es:'Vender',fr:'Vendre',de:'Verkaufen',ja:'売却',ko:'매도',id:'Jual','zh-TW':'賣出','zh-CN':'卖出'},portfolio:{en:'Portfolio',vi:'Danh mục','pt-BR':'Carteira','pt-PT':'Carteira',es:'Cartera',fr:'Portefeuille',de:'Portfolio',ja:'ポートフォリオ',ko:'포트폴리오',id:'Portofolio','zh-TW':'投資組合','zh-CN':'投资组合'}};
async function home(uid,lang){const x=await M.portfolio(uid,{refresh:false});const groups=[['CRYPTO','🪙 Crypto'],['STOCK','🏢 Stocks'],['SECURITIES','📊 Securities']];const lines=groups.map(([key,label])=>{const rows=x.assets.filter(a=>a.category===key).map(a=>{const d=a.open?((a.price-a.open)/a.open*100):0;return `${d>=0?'🟢':'🔴'} **${a.symbol}** • ${compactNumber(a.price)} CXu • ${d>=0?'▲':'▼'} ${Math.abs(d).toFixed(2)}%`;}).join('\n');return `**${label}**\n${rows||'—'}`;}).join('\n\n');const e=new EmbedBuilder().setTitle(mtx(lang,S.title)).setDescription('⚠️ '+mtx(lang,{en:'100% fictional market game — virtual assets and CXu only. Prices do not represent real markets.',vi:'Game thị trường 100% hư cấu — chỉ dùng tài sản ảo và CXu. Giá không đại diện thị trường thật.','pt-BR':'Apenas simulação de jogo — sem dinheiro ou ações reais.','pt-PT':'Apenas simulação de jogo — sem dinheiro ou ações reais.',es:'Solo simulación de juego — sin dinero ni valores reales.',fr:'Simulation de jeu uniquement — aucun argent ni titre réel.',de:'Nur Spielsimulation — kein echtes Geld oder echte Wertpapiere.',ja:'ゲーム内シミュレーションのみ — 実際のお金や証券は使用しません。',ko:'게임 시뮬레이션 전용 — 실제 돈이나 증권을 사용하지 않습니다.',id:'Hanya simulasi game — tanpa uang atau saham nyata.','zh-TW':'僅為遊戲模擬 — 不涉及真實金錢或證券。','zh-CN':'仅为游戏模拟 — 不涉及真实金钱或证券。'})).addFields({name:'🔥 '+mtx(lang,{en:'Market',vi:'Thị trường','pt-BR':'Mercado','pt-PT':'Mercado',es:'Mercado',fr:'Marché',de:'Markt',ja:'市場',ko:'시장',id:'Pasar','zh-TW':'市場','zh-CN':'市场'}),value:lines},{name:'💰 CXu',value:compactNumber(x.w.cstar),inline:true},{name:'💼 '+mtx(lang,S.portfolio),value:compactNumber(x.value)+' CXu',inline:true},{name:'📊 '+mtx(lang,{en:'P/L',vi:'Lãi/Lỗ','pt-BR':'Lucro/Prejuízo','pt-PT':'Lucro/Prejuízo',es:'Ganancia/Pérdida',fr:'Gain/Perte',de:'Gewinn/Verlust',ja:'損益',ko:'손익',id:'Untung/Rugi','zh-TW':'損益','zh-CN':'盈亏'}),value:`${x.unrealized>=0?'+':''}${compactNumber(x.unrealized)} CXu`,inline:true});const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`market:buy:${uid}`).setLabel(mtx(lang,S.buy)).setEmoji('🛒').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`market:sell:${uid}`).setLabel(mtx(lang,S.sell)).setEmoji('💸').setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId(`market:portfolio:${uid}`).setLabel(mtx(lang,S.portfolio)).setEmoji('📊').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId(`market:refresh:${uid}`).setLabel(mtx(lang,{en:'Refresh',vi:'Làm mới','pt-BR':'Atualizar','pt-PT':'Atualizar',es:'Actualizar',fr:'Actualiser',de:'Aktualisieren',ja:'更新',ko:'새로고침',id:'Segarkan','zh-TW':'重新整理','zh-CN':'刷新'})).setEmoji('🔄').setStyle(ButtonStyle.Primary));return{embeds:[e],components:[row]};}
async function port(uid,lang){const x=await M.portfolio(uid);const prices=new Map(x.assets.map(a=>[a.symbol,a.price]));const avg=mtx(lang,{en:'avg',vi:'TB','pt-BR':'média','pt-PT':'média',es:'prom.',fr:'moy.',de:'Ø',ja:'平均',ko:'평균',id:'rata-rata','zh-TW':'均價','zh-CN':'均价'}),now=mtx(lang,{en:'now',vi:'hiện tại','pt-BR':'agora','pt-PT':'agora',es:'ahora',fr:'actuel',de:'jetzt',ja:'現在',ko:'현재',id:'sekarang','zh-TW':'目前','zh-CN':'当前'});const lines=x.p.positions.length?x.p.positions.map(p=>`**${p.symbol}** ×${p.quantity} • ${avg} ${p.avgCost.toFixed(2)} • ${now} ${(prices.get(p.symbol)||0).toFixed(2)}`).join('\n'):'—';return{embeds:[new EmbedBuilder().setTitle('💼 '+mtx(lang,S.portfolio)).setDescription(lines).addFields({name:mtx(lang,{en:'Unrealized P/L',vi:'Lãi/Lỗ chưa thực hiện','pt-BR':'Lucro/Prejuízo não realizado','pt-PT':'Lucro/Prejuízo não realizado',es:'Ganancia/Pérdida no realizada',fr:'Gain/Perte latent',de:'Nicht realisierter Gewinn/Verlust',ja:'含み損益',ko:'미실현 손익',id:'Untung/Rugi belum terealisasi','zh-TW':'未實現損益','zh-CN':'未实现盈亏'}),value:`${x.unrealized>=0?'+':''}${Math.floor(x.unrealized)} CXu`,inline:true},{name:mtx(lang,{en:'Realized P/L',vi:'Lãi/Lỗ đã thực hiện','pt-BR':'Lucro/Prejuízo realizado','pt-PT':'Lucro/Prejuízo realizado',es:'Ganancia/Pérdida realizada',fr:'Gain/Perte réalisé',de:'Realisierter Gewinn/Verlust',ja:'実現損益',ko:'실현 손익',id:'Untung/Rugi terealisasi','zh-TW':'已實現損益','zh-CN':'已实现盈亏'}),value:`${Math.floor(x.p.realizedPnl||0)} CXu`,inline:true})],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`market:refresh:${uid}`).setLabel(mtx(lang,{en:'Market',vi:'Thị trường','pt-BR':'Mercado','pt-PT':'Mercado',es:'Mercado',fr:'Marché',de:'Markt',ja:'市場',ko:'시장',id:'Pasar','zh-TW':'市場','zh-CN':'市场'})).setStyle(ButtonStyle.Primary))]};}
function tradeModal(uid,kind,lang){return new ModalBuilder().setCustomId(`market:modal:${kind}:${uid}`).setTitle(`${kind==='buy'?'🛒':'💸'} ${mtx(lang,S[kind])}`).addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('symbol').setLabel(mtx(lang,{en:'Asset symbol',vi:'Mã tài sản','pt-BR':'Símbolo','pt-PT':'Símbolo',es:'Símbolo',fr:'Symbole',de:'Symbol',ja:'銘柄コード',ko:'종목 코드',id:'Simbol','zh-TW':'代號','zh-CN':'代码'})).setPlaceholder('CRGI').setStyle(TextInputStyle.Short).setRequired(true)),new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('quantity').setLabel(mtx(lang,{en:'Quantity',vi:'Số lượng','pt-BR':'Quantidade','pt-PT':'Quantidade',es:'Cantidad',fr:'Quantité',de:'Menge',ja:'数量',ko:'수량',id:'Jumlah','zh-TW':'數量','zh-CN':'数量'})).setPlaceholder('10').setStyle(TextInputStyle.Short).setRequired(true)));}
async function handle(i,lang){
  const p=i.customId.split(':');
  const kind=p[1];
  const owner=p[p.length-1];

  if(String(i.user.id)!==String(owner)){
    return i.reply({
      content:'❌ '+mtx(lang,{
        en:'This panel belongs to another player.',
        vi:'Bảng này thuộc về người chơi khác.',
        'zh-CN':'此面板属于其他玩家。'
      }),
      flags:64
    });
  }

  // showModal itself acknowledges the interaction.
  // Never defer these two buttons before showModal().
  if(kind==='buy'||kind==='sell'){
    return i.showModal(tradeModal(owner,kind,lang));
  }

  // Portfolio can touch MongoDB: acknowledge first.
  if(kind==='portfolio'){
    await i.deferUpdate();
    const payload=await port(owner,lang);
    return i.editReply(payload);
  }

  // Refresh calls market tick + portfolio: acknowledge first.
  if(kind==='refresh'){
    await i.deferUpdate();
    const payload=await home(owner,lang);
    return i.editReply(payload);
  }

  // Modal Buy/Sell performs DB writes: acknowledge immediately.
  if(kind==='modal'){
    await i.deferReply({flags:64});

    try{
      const action=p[2];
      const symbol=i.fields
        .getTextInputValue('symbol')
        .trim()
        .toUpperCase();

      const qty=i.fields.getTextInputValue('quantity');

      if(action!=='buy'&&action!=='sell'){
        throw new Error('INVALID_MARKET_ACTION');
      }

      const r=await M[action](owner,symbol,qty);

      return i.editReply({
        content:`✅ ${mtx(lang,action==='buy'?{
          en:'Bought',
          vi:'Đã mua',
          'zh-CN':'已买入'
        }:{
          en:'Sold',
          vi:'Đã bán',
          'zh-CN':'已卖出'
        })} ${r.quantity} ${r.asset.symbol} • ${compactNumber(r.cost||r.proceeds)} CXu`
      });

    }catch(e){
      const errors={
        INVALID_QUANTITY:{
          en:'Quantity must be a whole number from 1 to 100,000.',
          vi:'Số lượng phải là số nguyên từ 1 đến 100.000.'
        },
        ASSET_NOT_FOUND:{
          en:'Asset not found or trading is disabled.',
          vi:'Không tìm thấy tài sản hoặc tài sản đang ngừng giao dịch.'
        },
        INSUFFICIENT_CXU:{
          en:'Not enough CXu.',
          vi:'Bạn không đủ CXu.'
        },
        NOT_ENOUGH_ASSET:{
          en:'You do not own enough of this asset.',
          vi:'Bạn không sở hữu đủ tài sản này.'
        },
        INVALID_MARKET_ACTION:{
          en:'Invalid market action.',
          vi:'Thao tác thị trường không hợp lệ.'
        }
      };

      const z=errors[e.message];

      return i.editReply({
        content:`❌ ${z?mtx(lang,z):e.message}`
      });
    }
  }
}
module.exports={home,handle};
