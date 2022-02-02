const axios=require('axios')
const cheerio=require('cheerio')
const express=require('express')
const puppeteer=require('puppeteer')
const objecttocsv=require('object-to-csv')
const { arrayBuffer } = require('stream/consumers')

netlinks=[]
netvotes=[]
netanswer=[]
netquestions=[]
const obj={
    link:0,
    cnt:0,
    vote:0,
    ans:0
}
//netquestions=[obj,obj]
i=1;
site_url='https://stackoverflow.com/questions?tab=newest&page='+i
async function scrap(){
    const browser=await puppeteer.launch() //learn await
    const page=await browser.newPage()  
    var links=[]
    await page.goto(site_url)
    //await page.screenshot({path: "amazing.png",fullpage : true})  //full page screenshot
    const names = await page.evaluate(()=>{
        return questions={
            links: Array.from(document.querySelectorAll(' div.summary > h3 > a')).map((x)=>x.href),
            answers: Array.from(document.querySelectorAll('div.statscontainer > div.stats > div.status.unanswered > strong')).map(x=>x.textContent),
            votes: Array.from(document.querySelectorAll('div.statscontainer > div.stats > div.vote > div > span > strong')).map(x=>x.textContent)
        }
    })
    Array.prototype.push.apply(netlinks, names.links);
    Array.prototype.push.apply(netvotes, names.votes);
    Array.prototype.push.apply(netanswer, names.answers);
    //console.log(names)
    const mapurl = (questions, obj) => {
        return questions.map(item => {
            var temp = Object.assign({}, item);
            if (temp.name === obj.link) {
                temp.cnt = temp.vote+obj.vote;
                temp.cnt = temp.answer+obj.ans;
                temp.cnt = temp.cnt+obj.cnt;
            }
            return temp;
        });
    }    
    for(i=0;i<netlinks.length;i++)
    {
        obj.link=netlinks[i];
        obj.vote=parseInt(netvotes[i]);
        obj.ans=parseInt(netanswer[i]);
        obj.cnt=1;
        console.log(obj)
        n=netquestions.length
        var updatedquestion = mapurl(netquestions, obj);
        if(updatedquestion.size!=n)
            netquestions.push(obj);
        else
            netquestions=updatedquestion;
    }
    console.log("needed answere")
    console.log(netquestions)
    const app=express()
    app.get('/',async(req,res)=>{
        const csv=new objecttocsv(netquestions)
        await csv.toDisk('./questions.csv')

        console.log( await csv.toString());
    })
    app.listen(5000)
    await browser.close()
}

scrap()