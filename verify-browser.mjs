import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(process.execPath);
const {chromium}=require('playwright');
const {server}=await import('./local-preview.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const base='http://127.0.0.1:4173';
const results=[],errors=[];
const interactionsOnly=process.argv.includes('--interactions');
for(const width of interactionsOnly?[390]:[390,1440]){
 const context=await browser.newContext({viewport:{width,height:900}});
 await context.addInitScript(()=>{
   window.__vitals={lcp:0,cls:0};
   new PerformanceObserver(list=>{for(const e of list.getEntries())window.__vitals.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
   new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__vitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
 });
 const page=await context.newPage();
 await page.route('https://subtle-pothos-f050bf.netlify.app/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Local iframe test</title>'}));
 page.on('pageerror',error=>errors.push(error.message));
 for(const route of interactionsOnly?['/']:['/','/beauty','/consultant-demo','/clinic-demo','/terms','/warranty'])for(const lang of ['ru','et','en']){
   const url=base+route+(lang==='ru'?'':'?lang='+lang);
   const response=await page.goto(url,{waitUntil:'networkidle'});assert.equal(response.status(),200);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('h1').count(),1);
   assert.ok(await page.locator('h1').isVisible());
   if(lang==='ru')await page.screenshot({path:`qa-${route==='/'?'home':route.slice(1)}-${width}.png`,fullPage:false});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=1,`${width} ${route} ${lang}: horizontal overflow ${overflow}`);
   const metadata=await page.evaluate(()=>({title:document.title,canonical:document.querySelector('link[rel="canonical"]').href,description:document.querySelector('meta[name="description"]').content,vitals:window.__vitals}));
   assert.equal(metadata.canonical,'https://qse-lab.com'+route+(lang==='ru'?'':'?lang='+lang));
   const broken=await page.locator('img').evaluateAll(images=>images.filter(i=>!i.closest('dialog')&&i.loading!=='lazy'&&(!i.complete||!i.naturalWidth)).map(i=>i.src));assert.deepEqual(broken,[]);
   if(route==='/'){
     assert.equal(await page.locator('[data-form-language]').inputValue(),lang.toUpperCase());
     await page.locator('[data-plan="starter"]').click();assert.equal(await page.locator('[name="project_type"]').inputValue(),'starter');
     assert.equal(await page.locator('[name="budget"]').inputValue(),'starter');
     assert.equal(await page.locator('.ai-audit-frame').getAttribute('src'),'about:blank');
     await page.locator('[data-case-open][aria-controls="beauty-case-modal"]').click();assert.ok(await page.locator('#beauty-case-modal').isVisible());
     await page.locator('#beauty-case-modal [data-case-close]').click();assert.ok(!await page.locator('#beauty-case-modal').isVisible());
     await page.locator('[data-case-open][aria-controls="ai-audit-modal"]').click();
     assert.equal(new URL(await page.locator('.ai-audit-frame').getAttribute('src')).searchParams.get('lang'),lang);
     await page.locator('#ai-audit-modal [data-case-close]').click();
   }
   results.push({width,route,lang,...metadata});
 }
 // Check a real language navigation after storage has been set to another language.
 await page.goto(base+'/?lang=en');await page.locator('a[data-language="et"]').click();assert.equal(await page.locator('html').getAttribute('lang'),'et');
 await page.goto(base+'/');assert.equal(await page.locator('html').getAttribute('lang'),'ru');
 await context.close();
}
await browser.close();server.close();assert.deepEqual(errors,[],'browser JavaScript errors');
if(!interactionsOnly)fs.writeFileSync('seo-check-results.json',JSON.stringify(results,null,2));
console.log(`Browser checks passed: ${results.length} pages at ${interactionsOnly?'390':'390/1440'}px, language navigation, form plan selection, project modal and deferred AI iframe. No JS errors or horizontal overflow. No forms submitted.`);
