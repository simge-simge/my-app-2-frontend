const fs = require('fs');
const ts = require('typescript');
const { chromium, expect } = require('@playwright/test');
const source = fs.readFileSync('e2e/critical-journeys.spec.ts','utf8').split('test.beforeEach')[0].replace('await expect(page.getByText("Hello, Current Reader")).toBeVisible()', 'await expect(page).toHaveURL(/\\/home$/)');
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const {mockBoundaries,login} = new Function('require', 'exports', js + '\nreturn {mockBoundaries,login};')(require, {});
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({baseURL:'http://127.0.0.1:8081',viewport:{width:390,height:844}});
 await mockBoundaries(page);
 let profile={id:'10000000-0000-0000-0000-000000000001',display_name:'Current Reader',avatar_url:null,location:null,contacts:{},community_id:null,community_name:null,admin:false,is_app_admin:false,pending_community_name:null};
 let uploads=0;
 await page.route('**/profile/me/',route=>{
   if(route.request().method()==='PATCH') profile={...profile,...route.request().postDataJSON()};
   return route.fulfill({json:profile});
 });
 await page.route('**/storage/v1/object/**',route=>{
   if(route.request().method()==='POST') {uploads++; return route.fulfill({json:{Key:'avatar',Id:'avatar'}});}
   return route.fulfill({path:'assets/images/avatars/blue.png',contentType:'image/png'});
 });
 await login(page);
 await page.goto('/settings');
 await page.getByRole('button',{name:'Change picture',exact:true}).click();
 await expect(page.getByRole('radio',{name:/^Use .* avatar$/})).toHaveCount(5);
 await page.locator('img').evaluateAll(images => Promise.all(images.map(img => img.decode().catch(()=>{}))));
 await page.screenshot({path:'tmp/profile-picture-mobile.png',fullPage:true});
 await page.getByRole('radio',{name:'Use sage avatar',exact:true}).click();
 await expect.poll(()=>profile.avatar_url).toBe('default:sage');
 await page.reload();
 await page.getByRole('button',{name:'Change picture',exact:true}).click();
 await expect(page.getByRole('radio',{name:'Use sage avatar',exact:true})).toHaveAttribute('aria-checked','true');
 const chooser=page.waitForEvent('filechooser');
 await page.getByRole('button',{name:'Pick from library',exact:true}).click();
 await (await chooser).setFiles('assets/images/avatars/blue.png');
 await expect(page.getByText('Crop photo',{exact:true})).toBeVisible();
 const apply=page.getByRole('button',{name:'Apply crop',exact:true});
 await expect(apply).toBeEnabled();
 await apply.click();
 await expect.poll(()=>uploads).toBe(1);
 await expect.poll(()=>profile.avatar_url).toContain('/profile_pictures/');
 await expect(page.getByText('Crop photo',{exact:true})).not.toBeVisible();
 await expect(page.getByRole('img',{name:'Profile picture',exact:true})).toHaveCount(1);
 await page.setViewportSize({width:1280,height:900});
 await page.screenshot({path:'tmp/profile-picture-desktop.png',fullPage:true});
 console.log('PASS: mobile settings, five defaults, persistence, square crop, storage upload, saved photo, desktop layout');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
