import{i as P,a as v,ci as O,b as _,b5 as f}from"./index-58898efa.js";function Q(r){return typeof r=="function"?r():P(r)}var g=Object.defineProperty,b=Object.defineProperties,d=Object.getOwnPropertyDescriptors,y=Object.getOwnPropertySymbols,w=Object.prototype.hasOwnProperty,j=Object.prototype.propertyIsEnumerable,c=(r,e,t)=>e in r?g(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,a=(r,e)=>{for(var t in e||(e={}))w.call(e,t)&&c(r,t,e[t]);if(y)for(var t of y(e))j.call(e,t)&&c(r,t,e[t]);return r},q=(r,e)=>b(r,d(e));let p={};function x(r,e,t={}){const{mode:n="replace",route:u=v(),router:s=O(),transform:m=o=>o}=t;return _({get(){var o;const l=(o=u.query[r])!=null?o:e;return m(l)},set(o){p[r]=o===e||o===null?void 0:o,f(()=>{s[Q(n)](q(a({},u),{query:a(a({},u.query),p)})),f(()=>p={})})}})}const i={number:{fromQuery:r=>Number(r),toQuery:r=>String(r)},string:{fromQuery:r=>r,toQuery:r=>r},boolean:{fromQuery:r=>r.toLowerCase()==="true",toQuery:r=>r?"true":"false"}};function S({name:r,defaultValue:e}){const n=i[typeof e]??i.string,u=x(r,n.toQuery(e));return _({get(){return n.fromQuery(u.value)},set(s){u.value=n.toQuery(s)}})}export{S as u};
