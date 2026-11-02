const fs = require('fs');
const ts = require('typescript');
const { chromium } = require('@playwright/test');
const source = fs.readFileSync('e2e/critical-journeys.spec.ts','utf8').split('test.beforeEach')[0].replace('books: [book]', 'books: Array.from({length: 12}, (_, i) => ({...book, id: book.id + i}))').replace('await expect(page.getByText("Hello, Current Reader")).toBeVisible()', 'await expect(page).toHaveURL(/\\/home$/)');
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const {mockBoundaries,login,book} = new Function('require', 'exports', js + '\nreturn {mockBoundaries,login,book};')(require, {});
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({baseURL:'http://127.0.0.1:8081',viewport:{width:355,height:700}});
 await mockBoundaries(page);
 await login(page);
 for(const size of [{width:355,height:640},{width:390,height:844},{width:1280,height:800}]){
  await page.setViewportSize(size);
  for(const [name,path] of [['book','/books/'+book.id],['person','/members/'+book.owner_id]]){
   await page.goto('http://127.0.0.1:8081'+path);
   await page.getByText(name==='book'?'A science-fiction classic.':'Ada Reader',{exact:true}).waitFor();
   await page.waitForTimeout(700);
   console.log(JSON.stringify({name,size,overflow:await page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight+2 && ['auto','scroll'].includes(getComputedStyle(e).overflowY)).map(e=>({height:e.clientHeight,content:e.scrollHeight})))}));
   await page.screenshot({path:'tmp/detail-'+name+'-'+size.width+'.png'});
  }
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
