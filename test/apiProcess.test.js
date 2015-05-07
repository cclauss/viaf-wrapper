var should = require('should'),
	apiProcess = require("../apiProcess.js"),
	request   = require('request'),
	fs = require('fs')

describe('apiProcess', function () {

	this.timeout(25000);

	// try to update the record before we start
	// if there is no internet then it doesn't matter
	// just use the existing one

	before(function(done){
		request('http://viaf.org/viaf/search?query=local.mainHeadingEl+all+%22Jack%20Kerouac%2C%201922-1969%22&sortKeys=holdingscount&httpAccept=application/xml', function (error, response, body) {
			if (!error && response.statusCode == 200) {

				//write out the XML
				fs.writeFile("./test/data/search.xml", body, function(err) {
					if(err) {
						console.log("Could not update xml file",err)
					}
					done()				
				})
			}
		})
	})

	//load the data before each test	
	var xml = ""
	beforeEach(function(done){
		//load the test data
		fs.readFile('./test/data/search.xml', function (err, data) {
			if (err) {
				throw err; 
			}
			xml = data.toString()
			done()
		})
	})


	it('XML process - Search result - split records', function (done) {

		apiProcess.splitSearchResults(xml, function(results){

			//test if we have version number and count and some records
			results.version.should.be.above(1)
			results.total.should.be.above(190)
			results.records.length.should.be.above(9)

			done()
		})
	

	})


	//in prod we process the xml->json once but for these tests
	//we are going to do it for each sub-set of data
	it('XML process - Record - basic info', function (done) {


		apiProcess.splitSearchResults(xml, function(results){


			var r = apiProcess.recordBasic(results.records[0])

			r.viafId.should.equal('27066713')
			r.nameType.should.equal('Personal')
			r.primaryTopic.should.equal('http://viaf.org/viaf/27066713')
			r.recordLength.should.equal(5785)
			r.birthDate.should.equal('1922-03-12')
			r.deathDate.should.equal('1969-10-21')
			r.dateType.should.equal('lived')


			done()
		})
	

	})

	it('XML process - Record - source', function (done) {


		apiProcess.splitSearchResults(xml, function(results){


			var r = apiProcess.recordSources(results.records[0])

			var test = {}
			//grab the LC for testing
			for (var x in r){

				if (r[x].source === 'LC') test = r[x]

			}


			test.nsid.should.equal('n80036674')
			test.source.should.equal('LC')
			test.value.should.equal('LC|n  80036674')
			test.differentiated.should.equal(true)
			test.sparse.should.equal(false)


			done()
		})
	

	})




	it('XML process - Record - MainHeading', function (done) {


		apiProcess.splitSearchResults(xml, function(results){


			var r = apiProcess.recordMainHeading(results.records[0])

			r.heading.should.equal('Kerouac, Jack, 1922-1969.')

			for (var x in r.mainHeadingsData){
				x = r.mainHeadingsData[x]
				if (x.text === 'Kerouac, Jack, 1922-1969.'){
					x.source.indexOf('LC').should.be.above(-1)
					x.source.indexOf('BNF').should.be.above(-1)
				}
			}

			for (var x in r.mainHeadingEls){
				x = r.mainHeadingEls[x]
				if (x.id === 'LC|n  80036674'){
					
					x.dtype.should.equal("MARC21")
					x.ind1.should.equal("1")
					x.ind2.should.equal(" ")
					x.tag.should.equal("100")
					x.a.should.equal("Kerouac, Jack,")
					x.d.should.equal("1922-1969")
					x.source.should.equal("LC")
				}
			}

			done()
		})
	

	})


	it('XML process - Record - fixed', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordFixed(results.records[0])

			//b === ?
			r.gender.should.equal('b')
			done()
		})
	})

	it('XML process - Record - x400s', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordX400(results.records[0])
  			for (var x in r){

  				x = r[x]

  				if (x.normalized==='kerouac jean louis lebris de 1922 1969'){

  					x.dtype.should.equal("MARC21")
  					x.ind1.should.equal("1")
  					x.ind2.should.equal(" ")
  					x.tag.should.equal("400")
  					x.sources[0].should.equal('NLA')
  					x.a.should.equal('Kerouac, Jean Louis Lebris de,')
  					x.d.should.equal('1922-1969')
  					break
  				}
  			}

			done()
		})
	})


	it('XML process - Record - x500s', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordX500(results.records[0])
  			
  			for (var x in r){

  				x = r[x]

  				if (x.normalized==='cassady carolyn 1923 2013'){

  					x.dtype.should.equal("MARC21")
  					x.ind1.should.equal("1")
  					x.ind2.should.equal(" ")
  					x.tag.should.equal("500")
  					x.viafLink.should.equal("93029979")  					
  					x.sources[0].should.equal('DNB')
  					x.a.should.equal('Cassady, Carolyn')
  					x.d.should.equal('1923-2013')
  					x.e.should.equal('Beziehung familiaer')
  					break
  				}
  			}

			done()
		})
	})

	it('XML process - Record - coAuthors', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordCoAuthors(results.records[0])  			
  			for (var x in r){
  				x = r[x]
  				if (x.text==='Charters, Ann.'){
  					x.count.should.be.above(49)
  					x.tag.should.equal("950")
  					x.sources.length.should.be.above(8)
  					break
  				}
  			}
			done()
		})
	})

	it('XML process - Record - Publishers', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordPublishers(results.records[0])  

 			for (var x in r){
  				x = r[x]
  				if (x.text==='Gallimard'){
  					x.count.should.be.above(174)
  					x.sources.length.should.be.above(6)
  					break
  				}
  			}
			done()
		})
	})


	it('XML process - Record - Dates', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordDates(results.records[0])  

			r.max.should.be.above(200)
			r.min.should.be.above(190)
			r['1950'].count.should.be.above(78)

			done()
		})
	})



	it('XML process - Record - RecFormats', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordRecFormats(results.records[0])  

 			for (var x in r){
  				x = r[x]
  				if (x.text==='am'){
  					x.count.should.be.above(1440)
  					x.sources.length.should.be.above(10)
  					break
  				}
  			}
			done()
		})
	})

	it('XML process - Record - RelatorCodes', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordRelatorCodes(results.records[0])  

 			for (var x in r){
  				x = r[x]
  				if (x.text==='070'){
  					x.count.should.be.above(140)
  					x.sources.length.should.be.above(1)
  					break
  				}
  			}
			done()
		})
	})


	it('XML process - Record - ISBNs', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordISBNs(results.records[0])  

 			for (var x in r){
  				x = r[x]
  				if (x.text==='9780140185218'){
  					x.count.should.be.above(8)
  					x.sources.length.should.be.above(5)
  					break
  				}
  			}
			done()
		})
	})

	it('XML process - Record - Covers', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordCovers(results.records[0])  

 			for (var x in r){
  				x = r[x]
  				if (x.text==='0140185216'){
  					x.count.should.be.above(8)
  					x.xText.should.equal('+-+1670365965')
  					x.sources.length.should.be.above(5)
  					break
  				}
  			}
			done()
		})
	})

	it('XML process - Record - Countries', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordCountries(results.records[0])  

 			for (var x in r){
  				x = r[x]
  				if (x.text==='US'){
  					x.count.should.be.above(420)
  					x.scaled.should.be.above(7)
  					x.sources.length.should.be.above(10)
  					break
  				}
  			}
			done()
		})
	})	

	it('XML process - Record - languageOfEntity', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordLanguageOfEntity(results.records[0])  

 			for (var x in r){
  				x = r[x]
  				if (x.text==='eng'){
  					x.sources.length.should.be.above(2)
  					break
  				}
  			}
			done()
		})
	})	

	it('XML process - Record - xLinks', function (done) {
		apiProcess.splitSearchResults(xml, function(results){
			var r = apiProcess.recordxLinks(results.records[0])  

 			for (var x in r){
  				x = r[x]
  				if (x.link==='http://en.wikipedia.org/wiki/Jack_Kerouac'){
  					x.type.should.equal('WKP')
  					break
  				}
  			}
			done()
		})
	})	

	it('XML process - Record - titles', function (done) {
		apiProcess.splitSearchResults(xml, function(results){

			var r = apiProcess.recordTitles(results.records[0])  

 			for (var x in r){
  				x = r[x]
  				if (x.title==='And the hippos were boiled in their tanks'){
  					x.sources.length.should.be.above(7)
  					x.sources.indexOf('LC').should.be.above(-1)
  					x.id.should.equal('VIAF|310940740')
  					break
  				}
  			}
			done()
		})
	})	

	it('XML process - Record - history', function (done) {
		apiProcess.splitSearchResults(xml, function(results){

			var r = apiProcess.recordHistory(results.records[0])  

 			for (var x in r){
  				x = r[x]
  				if (x.recid==='LC|n  80036674'){
 					x.time.should.equal('2009-03-03T12:03:29+00:00')
 					x.type.should.equal('add')
  					break
  				}
  			}
			done()
		})
	})	



})