import scrapy
import unicodedata
import re

pageLimit = 99
#scrapes vape-shop-dubai.net
class VapespiderSpider(scrapy.Spider):
    name = "vapespider"
    allowed_domains = ["vape-shop-dubai.net"]
    start_urls = ["https://vape-shop-dubai.net/collections/e-liquids-nic-salts"]

    #start of the scraping with the first page of the liquids
    def start_requests(self):
        yield scrapy.Request(url=self.start_urls[0], callback=self.parse, meta={'page':1})

    #parse a page
    def parse(self, response):
        #limit how many pages to scrape
        if response.meta['page'] > pageLimit:
            return
        else:
            meta = {'page': response.meta['page']+1}
            
        #get all products
        pageProducts = response.css('div.grid-product div.grid-product__content')
        #loop over the products
        for itemProduct in pageProducts:
            productLink = itemProduct.css('a::attr(href)').get()
            productImageLink = re.findall(r'src="([^"]+)"', itemProduct.css('div.image-wrap img[src]').get())[0]
            fullProductLink = 'https://vape-shop-dubai.net/' + productLink
            yield scrapy.Request(url=fullProductLink, callback=self.parseItem, meta={'itemLink':fullProductLink,
                                                                                     'productImageLink':productImageLink})

        

        #get the next page
        nextPage = response.css('div.pagination .next a::attr(href)').get()
        if nextPage != None:
            nextPageUrl = 'https://vape-shop-dubai.net' + nextPage    
            yield response.follow(nextPageUrl, callback=self.parse, meta=meta)
    
    #iterate over items
    def parseItem(self, response):
        factsDict = {}
        #get the facts about the product
        factsDict['name'] = response.css('h1.product-single__title::text').get().strip()
        factsDict['itemLink'] = response.meta['itemLink']
        factsDict['productImageLink'] = response.meta['productImageLink']
        productFacts = response.css('div.product-single__description-full ul li::text')
        for fact in productFacts:
            fact = unicodedata.normalize('NFKD', fact.get())
            try:
                factName, factValue = map(lambda x: x.strip(), fact.split(":"))
                factsDict[factName] = factValue
            except:
                factsDict["others"] = fact.strip()
        #variants (i.e. size and nicotine strength)
        variants = {}
        productVariants = response.css('div.variant-wrapper')
        for variant in productVariants:
            variantLabel = variant.css('label.variant__label::text').get().strip()
            if variantLabel not in variants.keys():
                variants[variantLabel] = []
            variantOptions = variant.css('fieldset.variant-input-wrap .variant-input')
            for variantOption in variantOptions:
                variants[variantLabel].append(variantOption.css('label::text').get().strip())

        factsDict['variants'] = variants

        yield factsDict
















        
