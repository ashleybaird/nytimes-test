const feedScript = document.createElement('script');
feedScript.src = 'http://np-ec2-nytimes-com.s3.amazonaws.com/dev/test/nyregion.js';
document.body.appendChild(feedScript);

const NYTD = {
    data : {
    	language: 'english',
    	stories: []
    },
    render_section_front : function (params){
      this.content = params.page.content;
      this.parseData();
    },
    parseData : function(){
    	const self = this;
   		const feed = document.getElementById('feed');
   		const feedContainer = this.createElement('div', 'feed-container container is-hidden');
   		this.feedList = this.content.filter(type => type.name.includes('Column'));

   		// Loop through feed and add stories to data array
   		this.feedList.forEach((pages, index) => {
   			pages.collections.forEach((storyList, index) => {
	   			if(storyList.renderStyle !== 'HeadlineOnly' && storyList.renderStyle !== 'Ads') {
	   				storyList.assets.forEach((story) => {
		   				if(story.headline && story.summary && story.images !== undefined && story.images.length > 0) {
		   					// Separate English and Martian text
		   					story.languages = self.addLanguages(story);
		   					self.data.stories.push(story);
		   				}
	   				});
	   			}
   			});

   			window.addEventListener('load', function () {
   				self.setHeight(0);
   				
				// Show Hidden Feed
				const hiddenContent = document.getElementsByClassName('is-hidden');
				Array.from(hiddenContent).forEach((content) => {
					content.classList.remove('is-hidden');
				});
			});
   		});

   		// Loop through stories and append to the DOM
   		let count = 1;
		this.data.stories.forEach((story, index) => {
			let feedClass = 'feed-page flex-container';
			if(index === 0 || index % 5 === 0) {
	   			if(index === 0) {
	   				feedClass += ' is-shown';
	   			}
				if(self.page) {
					// Append story to feed
   					feedContainer.appendChild(self.page);
					count++;
				}
				self.page = self.createElement('div', feedClass, null, 'data-page', count);
			} 
			self.formatData(story);
		});


   		// Add feed/pagination to container
   		feed.appendChild(feedContainer);
   		this.addPagination(feed, count - 1);
    },
	formatData: function(story) {
		const storyContainer = this.createElement('div', 'story');
		const leftContainer = this.createElement('div', 'l-side');
		
		// Create date container
		const storyDate = this.createElement('div', 'story-date story-content');
		const dateText = new Date(story.lastPublished.substring(0, story.lastPublished.indexOf('T'))).toDateString().split(' ').slice(1).join(' ');
		const date = this.createElement('div', null, dateText);
		storyDate.appendChild(date);
		leftContainer.appendChild(storyDate);	

		// Create content container
		const storyContent = this.createElement('div', 'story-info story-content');
		const storyUrl = this.createElement('a', null, story.url);
		const headline = this.createElement('h3', 'headline is-content-toggle', story.languages.english.headline);
		const summary = this.createElement('p', 'summary is-content-toggle', story.languages.english.summary);
		const byline = this.createElement('span', 'byline is-content-toggle', story.languages.english.byline);
		storyUrl.appendChild(headline);
		storyContent.appendChild(storyUrl);
		storyContent.appendChild(summary);
		storyContent.appendChild(byline);
		leftContainer.appendChild(storyContent);

		// Create Image container and only if images present
		const self = this;
		let imageContainer;

		// Loop through images and use image that is atleast 320px;
		story.images[0].types.some(function(val) {
			const imgUrl = 'http://nytimes.com/' + val.content;
			imageContainer = self.createElement('div', 'story-image story-content');
			storyImage = self.createElement('img', null, imgUrl);
			return val.width >= 320;
		});
		imageContainer.appendChild(storyImage);	

		// Append story to DOM
		storyContainer.appendChild(leftContainer);
		storyContainer.appendChild(imageContainer);	
		self.page.appendChild(storyContainer);
	},
	setHeight: function(index) {
		const feedList = document.getElementsByClassName('feed-page');

		Array.from(feedList).forEach((feed) => {
			let height = 0;
			const storyList = feed.getElementsByClassName('story');

			Array.from(storyList).forEach((story) => {
				height += story.offsetHeight;
			});

			feed.style.height = height + 'px';
		});
		document.getElementsByClassName('feed-container').item(0).style.height = document.getElementsByClassName('feed-page').item(index).offsetHeight + 'px';
	},
	addLanguages: function(story) {
		let languages = {
			'english': {
				headline: story.headline,
				summary: story.summary,
				byline: story.byline
			},
			'martian': {}
		}

		// Loop through english content
		for(let content in languages.english) {
			if(languages.english[content]) {
				let wordArray = languages.english[content].split(" ");
				languages.martian[content] = [];
				// Loop through words and replace characters over 3
				wordArray.forEach((word, index) => {
					if(word.length > 3 && !word.match('[$]')) {
						if(!word.match('[.,:!?\\-]')) {
							/^[A-Z]/.test(word) ? word = 'Boinga' : word = 'boinga';
						} else {
							// If words have punctuation it replaces the words around them
							if(word.split('.').length > 2) {
								const wordArray = word.split('.');
								const lastElem = wordArray.pop();
								if(wordArray.length <= 3) {
									word = word;
								}
							} else {
								let splitWord = word.split('');
								if(word.match('[.,:!?]') && word.match('[.,:!?]').index + 1 === word.length) {
									const wordArray = word.split('');
									const lastElem = wordArray.pop();

									/^[A-Z]/.test(word) ? word = 'Boinga' + lastElem : word = 'boinga' + lastElem;
								} else {
									const wordArray = word.split('-');

									wordArray.forEach((word, index) => {
										if(word.length > 3) {
											wordArray[index] = /^[A-Z]/.test(word) ? 'Boinga' : 'boinga';
										}	
									});

									word = wordArray.join('-');
								}
							}
						}
					}

					languages.martian[content].push(word);
				});
				
				// Add Martian to languages object
				languages.martian[content] = languages.martian[content].join(' ');
			}
		};
		
		return languages;
	},
	addPagination: function(container, count) {
		const pagination = this.createElement('div', 'pagination is-hidden');
		const pageContainer = this.createElement('div', 'container');
		const paginationText = this.createElement('span', 'text-pgn', '<span id="current-pgn">1</span> of ' + count);
		const leftArrow = this.createElement('button', 'btn-arrow btn-arrow-prev btn js-arrow', null, 'data-direction', '-');
		const leftArrowImg = this.createElement('img', 'arrow-img', './img/left-arrow.png');
		const rightArrow = this.createElement('button', 'btn-arrow btn-arrow-next btn js-arrow', null, 'data-direction', '+');
		const rightArrowImg = this.createElement('img', 'arrow-img', './img/right-arrow.png');

		pagination.appendChild(pageContainer);
		pageContainer.appendChild(paginationText);
		leftArrow.appendChild(leftArrowImg);
		pageContainer.appendChild(leftArrow);
		rightArrow.appendChild(rightArrowImg);
		pageContainer.appendChild(rightArrow);
   		container.appendChild(pagination);

   		this.bindClick(count);
   		this.bindResize();
	},
	bindClick: function(count) {
		const self = this;
		window.addEventListener('load', function () {
			const arrows = document.getElementsByClassName('js-arrow');
			const languages = document.getElementsByClassName('js-toggle-language');
			let current = 1;

			// Bind arrow click
			Array.from(arrows).forEach((arrow, index) => {
				document.getElementsByClassName('js-arrow')[index].addEventListener('click', function(e) {
					// If there is annother page hides the current and shows the next
					if((this.getAttribute('data-direction') === '+' && current + 1 <= count) || (this.getAttribute('data-direction') === '-' && current - 1 >= 1)) {
						document.getElementsByClassName('is-shown').item(0).classList.remove('is-shown');
						
						if(this.getAttribute('data-direction') === '+'){
							current += 1;
						} else {
							current -= 1;
						};

						setTimeout(() => {
							self.setHeight(current - 1);
						}, 500);
						setTimeout(() => {
							document.querySelector("[data-page='" + current + "']").classList.add('is-shown');
						}, 600);
						document.querySelector('#current-pgn').textContent = current;
					}
				});
			});

			// Bind language toggle click
			Array.from(languages).forEach((languageBtn) => {
				languageBtn.addEventListener('click', function() {
					const language = this.getAttribute('data-language');
					if(self.data.language !== language) {
						self.data.language = language;
						self.data.stories.forEach((story, index) => {
							self.toggleLanguage(this, story.languages, language, index);
						});
					}
				});
			});
		});
	},
	bindResize: function() {
		const self = this;
		window.addEventListener('resize', function() {
			setTimeout(() => {
				self.setHeight(document.getElementsByClassName('is-shown').item(0));

			}, 10);
		});
	},
	toggleLanguage: function(btn, languageObj, language, index) {
		// Toggle active class on buttons
		document.querySelector('.btn.is-active').classList.remove('is-active');
		btn.classList.add('is-active');
		if(document.getElementsByClassName('story').item(index)) {
			const feedItem = document.getElementsByClassName('story').item(index);

			// Loop through story list and update content to language clicked
			for(let item in languageObj[language]) {
				if(languageObj[language][item]) {
					const el = feedItem.querySelector("." + item);
					const text = languageObj[language][item];
					el.classList.add('is-hidden', 'is-hidden-text');

					setTimeout(function(){
						el.textContent = text;
					}, 630);

					setTimeout(function(){
						el.classList.remove('is-hidden-text');
					}, 660);
				}
			}
			
		}
	},
	createElement: function(type, className = null, text = null, attribute = null, attributeVal = null) {
		const element = document.createElement(type);

		if(className) {
	   		element.className = className;
		}

	   	if(text) {
	   		if(type === 'img') {
		   		element.src = text;
		   	} else if(type === 'a') {
		   		element.href = text;
		   	} else {
	   			element.innerHTML = text;
		   	}
	   	}

	   	if(attribute) {
	   		element.setAttribute(attribute, attributeVal);
	   	}

	   	return element;
	}
}