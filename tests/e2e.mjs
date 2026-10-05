import { chromium } from "playwright";
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];
page.on("pageerror",e=>errors.push("pageerror: "+e.message));
page.on("console",m=>{if(m.type()==="error")errors.push("console: "+m.text())});
await page.goto("http://127.0.0.1:8000/index.html",{waitUntil:"networkidle"});
await page.locator("#menu").waitFor({state:"visible"});
if(await page.locator(".world-card").count())throw new Error("Fresh profile should have no worlds");

// Help/settings on menu.
await page.click("#helpMenuBtn");await page.locator("#helpModal").waitFor({state:"visible"});
if((await page.locator("#helpModal h3").count())<8)throw new Error("Help is incomplete");
await page.click("#helpModal [data-close]");
await page.click("#settingsMenuBtn");await page.locator("#settingsModal").waitFor({state:"visible"});
await page.fill("#music","0");await page.click("#settingsModal [data-close]");

// Create deterministic small creative world.
await page.click("#createWorldBtn");
await page.fill("#newName","QA World");
await page.fill("#newSeed","QA-2026");
await page.selectOption("#newMode","creative");
await page.selectOption("#newPreset","normal");
await page.selectOption("#newSize","small");
await page.click("#confirmWorldBtn");
await page.locator("#game").waitFor({state:"visible"});
if((await page.locator(".cell").count())!==1792)throw new Error("Small world cell count mismatch");
if((await page.locator(".tool").count())!==4)throw new Error("Tools missing");
if((await page.locator(".slot").count())!==9)throw new Error("Hotbar missing");
if(!(await page.locator("#player").isVisible()))throw new Error("Player missing");

// Player movement should alter coordinates.
await page.waitForTimeout(800);
const before=await page.locator("#player").getAttribute("style");
await page.keyboard.down("d");await page.waitForTimeout(550);await page.keyboard.up("d");
await page.waitForTimeout(100);
const after=await page.locator("#player").getAttribute("style");
if(before===after)throw new Error("Player did not move");

// Inventory/Crafting/Furnace.
await page.keyboard.press("e");await page.locator("#inventoryModal").waitFor({state:"visible"});
if((await page.locator("#inventory .item").count())<10)throw new Error("Creative inventory incomplete");
await page.keyboard.press("Escape");
await page.keyboard.press("c");await page.locator("#craftModal").waitFor({state:"visible"});
if((await page.locator("#crafting .recipe").count())<5)throw new Error("Crafting recipes missing");
await page.locator("#crafting .recipe button").first().click();
await page.keyboard.press("Escape");
await page.keyboard.press("f");await page.locator("#furnaceModal").waitFor({state:"visible"});
if((await page.locator("#furnace .recipe").count())<2)throw new Error("Furnace recipes missing");
await page.locator("#furnace .recipe button").first().click();
await page.keyboard.press("Escape");

// Place a block near starting area and undo/redo.
await page.keyboard.press("1");
const coordsText=await page.textContent("#coords");
const m=coordsText.match(/X\s+(\d+)\s+Y\s+(\d+)/);
if(!m)throw new Error("Could not read player coordinates");
const px=+m[1],py=+m[2];
let targetIndex=null;
for(let dy=-3;dy<=1&&targetIndex===null;dy++){
  for(let dx=-2;dx<=2;dx++){
    const x=px+dx,y=py+dy;
    if(x<0||y<0||x>=64||y>=28)continue;
    const i=y*64+x;
    if((await page.locator('.cell[data-index="' + i + '"]').getAttribute("data-type"))==="sky"){targetIndex=String(i);break;}
  }
}
if(targetIndex===null)throw new Error("No nearby sky cell found");
const stableTarget=page.locator('.cell[data-index="' + targetIndex + '"]');
await stableTarget.click();
if((await stableTarget.getAttribute("data-type"))!=="soil")throw new Error("Placement failed");
await page.keyboard.press("Control+z");
if((await stableTarget.getAttribute("data-type"))!=="sky")throw new Error("Undo failed");
await page.keyboard.press("Control+y");
if((await stableTarget.getAttribute("data-type"))!=="soil")throw new Error("Redo failed");

// Stats and save.
await page.click("#statsBtn");await page.locator("#statsModal").waitFor({state:"visible"});
if(!(await page.locator("#stats").textContent()).includes("נוצרו"))throw new Error("Stats missing");
await page.click("#statsModal [data-close]");
await page.keyboard.press("s");
const savedCount=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith("minc_world_v2_")).length);
if(savedCount!==1)throw new Error("World was not saved");

// Back to menu, duplicate, reopen.
await page.click("#menuBtn");await page.locator("#pauseModal").waitFor({state:"visible"});
await page.click("#backBtn");await page.locator("#menu").waitFor({state:"visible"});
if((await page.locator(".world-card").count())!==1)throw new Error("Saved world missing from menu");
await page.locator(".world-card [data-dup]").click();
if((await page.locator(".world-card").count())!==2)throw new Error("Duplicate world failed");
await page.locator(".world-card [data-open]").first().click();
await page.locator("#game").waitFor({state:"visible"});
if(!(await page.textContent("#worldName")).includes("copy"))throw new Error("Duplicate world did not open");

await page.screenshot({path:"qa-screenshot.png",fullPage:true});
if(errors.length)throw new Error("Browser errors:\n"+errors.join("\n"));
console.log("E2E QA passed");
await browser.close();