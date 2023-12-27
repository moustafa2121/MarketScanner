import scrapy, re

base = 'https://vapegateae.com'
pageLimit = 99

class VapespiderSpider(scrapy.Spider):
    name = "vapespider"
    allowed_domains = ["vapegateae.com"]
    start_urls = ['https://vapegateae.com/collections/all-e-liquids']

    def start_requests(self):
        yield scrapy.Request(url=self.start_urls[0], callback=self.parse, meta={'page':1})
        
    def parse(self, response):
        #limit how many pages to scrape
        if response.meta['page'] > pageLimit:
            return
        else:
            meta = {'page': response.meta['page']+1}
            
        #get all products    
        products = response.css('#CollectionSection > div > div > div.grid-uniform > div')
        #for each product
        for product in products:
            itemLink = base+product.css('a::attr(href)')[0].get()
            yield scrapy.Request(url=itemLink, callback=self.parseItem,
                                 meta={'itemLink':itemLink})


        #get the next page
        nextPageUrl = 'https://vapegateae.com/collections/all-e-liquids?page='+ str(meta['page'])   
        yield response.follow(nextPageUrl, callback=self.parse, meta=meta)

    def parseItem(self, response):
        returnDict = {}
        #for each item's page
        returnDict['itemLink'] = response.meta['itemLink']
        returnDict['productImageLink'] = response.css('.no-js.product__image-wrapper img::attr(src)')[0].get()
        returnDict['name'] = response.css('#ProductSection > div.grid > div.grid-item.large--three-fifths > h1::text')[0].get()
        returnDict['brand'] = response.css('#ProductSection > div.grid > div.grid-item.large--three-fifths > p::text')[0].get()

        #flavor and vgpg
        details = response.css('#ProductSection > div.grid > div.grid-item.large--three-fifths div div ul')[0].css('li')
        """if len(details[1].css('li span')) != 0:
            returnDict['flavor'] = [details[1].css('li span::text').get().strip()]
        else:
            returnDict['flavor'] = [details[1].css('li::text').get().split(':',1)[-1].strip()]
        """
        returnDict['flavor'] = [''.join([fl.get() for fl in response.css('#ProductSection > div.grid > div.grid-item.large--three-fifths > div:nth-child(3) > div:nth-child(5) > ul > li:nth-child(2)').css('::text')]).strip().split(':',1)[-1].strip()]
        if returnDict['flavor'][0] == '':
            returnDict['flavor'] = []
            
        #string tuple of two items
        try:
            returnDict['vgpg'] = ['/'.join(re.findall('(\d\d).*?(\d\d)', details[2].css('li::text').get())[0])]
        except:
            returnDict['vgpg'] = []
            
        #nic and size
        opts = response.css('select option')
        nic = list(set([int(re.findall('(\d\d?\d?)\ ?mg', t.css('::text').get())[0]) for t in opts]))
        nic.sort()
        returnDict['nic'] = nic
        size = list(set([int(re.findall('(\d\d?\d?)\ ?ml', t.css('::text').get())[0]) for t in opts]))
        size.sort()
        returnDict['size'] = size

        yield returnDict
            
