import{d,Z as p,i as e,e as a,o as t,f as s,F as h,h as m,k as n,t as y,a2 as k,b as f,g as w}from"./index-58898efa.js";const x={key:0},B={key:1},N={key:2,"font-mono":""},b={key:3,"op-70":""},g={key:4},C=d({__name:"c-key-value-list-item",props:{item:{}},setup(c){const _=c,{item:o}=p(_);return(v,i)=>{const l=k;return e(a).isArray(e(o).value)?(t(),s("div",x,[(t(!0),s(h,null,m(e(o).value,u=>(t(),s("div",{key:u},[n(l,{value:u,"show-icon":e(o).showCopyButton??!0},null,8,["value","show-icon"])]))),128))])):e(a).isBoolean(e(o).value)?(t(),s("div",B,[n(l,{value:e(o).value?"true":"false","displayed-value":e(o).value?"Yes":"No","show-icon":e(o).showCopyButton??!0},null,8,["value","displayed-value","show-icon"])])):e(a).isNumber(e(o).value)?(t(),s("div",N,[n(l,{value:String(e(o).value),"show-icon":e(o).showCopyButton??!0},null,8,["value","show-icon"])])):e(a).isNil(e(o).value)||e(o).value===""?(t(),s("div",b,y(e(o).placeholder??"N/A"),1)):(t(),s("div",g,[n(l,{value:e(o).value,"show-icon":e(o).showCopyButton??!0},null,8,["value","show-icon"])]))}}}),$={flex:"","flex-col":"","gap-2":""},A={class:"c-key-value-list__key","text-13px":"","lh-normal":""},S=d({__name:"c-key-value-list",props:{items:{default:()=>[]}},setup(c){const _=c,{items:o}=p(_),v=f(()=>o.value.filter(i=>!a.isNil(i.value)||!i.hideOnNil));return(i,l)=>{const u=C;return t(),s("div",$,[(t(!0),s(h,null,m(e(v),r=>(t(),s("div",{key:r.label,class:"c-key-value-list__item"},[w("div",A,y(r.label),1),n(u,{item:r,class:"c-key-value-list__value","font-bold":"","lh-normal":""},null,8,["item"])]))),128))])}}});export{S as _};
