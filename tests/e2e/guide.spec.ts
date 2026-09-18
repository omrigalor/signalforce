import {test,expect} from '@playwright/test';
test('map → pathway → call type → saved notes',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'See the problem. Find the path.'})).toBeVisible();
 await expect(page.locator('.map-node')).toHaveCount(16);await page.screenshot({path:'test-results/01-overview.png',fullPage:true});
 await page.getByRole('button',{name:'Service capacity',exact:true}).first().click();
 await expect(page.getByRole('heading',{name:'Service demand outgrows capacity'})).toBeVisible();
 await page.getByRole('button',{name:'Call view',exact:false}).first().click();
 await expect(page.getByRole('heading',{name:/Which contact reasons/})).toBeVisible();
 await page.getByRole('button',{name:'Follow-up',exact:true}).click();
 await expect(page.getByRole('heading',{name:/What has changed/})).toBeVisible();
 await page.getByLabel('Call notes',{exact:true}).fill('Validate order-status volume and ask who owns case routing.');
 await page.getByText('Problem and business impact understood',{exact:true}).click();
 await page.screenshot({path:'test-results/02-call-view.png',fullPage:true});
 await page.reload();await page.getByRole('button',{name:'Call view',exact:false}).first().click();
 await expect(page.getByLabel('Call notes',{exact:true})).toHaveValue('Validate order-status volume and ask who owns case routing.');
 await expect(page.getByRole('checkbox',{name:'Problem and business impact understood'})).toBeChecked();
 expect(errors).toEqual([]);
});
test('evidence filter, weak proof, keyboard drawer and grounded answers',async({page})=>{
 await page.goto('/#play/integration');
 await page.getByLabel('Published evidence only').check();await expect(page.locator('.path-node')).toHaveCount(0);
 await expect(page.getByText('No matched published proof is included',{exact:false})).toBeVisible();
 await page.getByLabel('Published evidence only').uncheck();await page.getByRole('button',{name:'Explore Why this might matter now'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'Show me proof',exact:true}).click();await expect(page.getByRole('heading',{name:'Evidence gap'})).toBeVisible();
 await page.getByLabel('Ask this pathway',{exact:true}).fill('What is Acme revenue?');await page.getByRole('button',{name:'Ask',exact:true}).click();await expect(page.getByText('This offline guide explains',{exact:false})).toBeVisible();
});
test('product reverse mapping, persona comparison and search',async({page})=>{
 await page.goto('/#products/data_360');await expect(page.getByRole('heading',{name:'Data 360',exact:true})).toBeVisible();await page.getByRole('button',{name:/AI ambition outruns trusted data/}).click();await expect(page.getByRole('heading',{name:'AI ambition outruns trusted data',exact:true})).toBeVisible();
 await page.goto('/#personas');await page.getByLabel('Compare Customer service leader',{exact:true}).check();await page.getByLabel('Compare Technology & architecture leader',{exact:true}).check();await expect(page.getByRole('heading',{name:'Same conversation. Different priorities.'})).toBeVisible();
 await page.keyboard.press('/');await page.getByLabel('Search the map').fill('Data Cloud');await page.getByRole('button',{name:/Data 360 Product/}).click();await expect(page.getByRole('heading',{name:'Data 360',exact:true})).toBeVisible();
});
test('mobile overview and reduced motion stay usable',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await expect(page.locator('.compact-map')).toBeVisible();await expect(page.locator('.app-shell')).toHaveClass(/motion-off/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Service capacity',exact:true}).last().click();await page.getByRole('button',{name:'Call view',exact:false}).first().click();await page.screenshot({path:'test-results/03-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
