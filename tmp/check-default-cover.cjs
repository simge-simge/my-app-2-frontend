const fs = require('fs');
const ts = require('typescript');
const { chromium } = require('@playwright/test');
let source = fs.readFileSync('e2e/critical-journeys.spec.ts','utf8').split('test.beforeEach')[0].replace('await expect(page.getByText("Hello, Current Reader")).toBeVisible()', 'await expect(page).toHaveURL(/\\/home$/)');
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const {mockBoundaries,login,book} = new Function('require', 'exports', js + '\nreturn {mockBoundaries,login,book};')(require, {});
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({baseURL:'http://127.0.0.1:8081',viewport:{width:390,height:844}});
 await mockBoundaries(page);
 await login(page);
 for (const [name,path] of [['detail','/books/'+book.id],['library','/library'],['explore','/explore'],['match','/matches/match-1']]) {
   await page.goto(path);
   await page.getByRole('img', {name:/by /i}).first().waitFor({timeout:30000});
   await page.waitForTimeout(600);
   await page.screenshot({path:'tmp/default-cover-'+name+'.png'});
   console.log(name, await page.getByRole('img').evaluateAll(elements=>elements.map(e=>({label:e.getAttribute('aria-label'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))));
 }
 await page.route('**/books/'+book.id, route=>!['fetch','xhr'].includes(route.request().resourceType()) ? route.fallback() : route.fulfill({json:{...book,title:'The Extraordinary Adventures of a Wandering Reader Across the Seven Forgotten Kingdoms',author:'Alexandra Catherine Montgomery-Wellington'}}));
 await page.goto('/books/'+book.id);
 await page.getByRole('img',{name:/Extraordinary/}).waitFor();
 await page.waitForTimeout(600);
 await page.screenshot({path:'tmp/default-cover-long-title.png'});
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

