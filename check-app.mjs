import { chromium } from 'playwright'

const b = await chromium.launch({ args: ['--no-sandbox'] })
const page = await b.newPage()
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push(e.message))
await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 })
const title = await page.title()
const navButtons = await page.locator('nav button').allTextContents()
await page.screenshot({ path: 'C:/Users/Milan/AppData/Local/Temp/app-check.png' })
console.log(JSON.stringify({ title, navButtons, jsErrors: errors }))
await b.close()
