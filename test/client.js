describe('Directives', function() {
    var el, scope;

    beforeEach(module('nikoInLondon.directives'));
    beforeEach(module('public/views/photo-modal.html', 'public/views/photo-new.html', 'public/views/photo-single.html'));

    describe('Photo', function() {
        beforeEach(inject(function($rootScope, $compile) {
            scope = $rootScope;
            scope.photo = {
                path: 'hello/world',
                title: 'Hello World',
                _id: '12398123'
            };
            el = angular.element('<photo model="photo"></photo>');
            $compile(el)(scope);
            scope.$digest();
        }));

        it("should have an image tag", function() {
            expect(el.find('img').length).toEqual(1);
        });
    });

    describe('PhotoGrid', function() {
        beforeEach(inject(function($rootScope, $compile) {
            scope = $rootScope;
            el = angular.element('<photo-grid></photo-grid>');
            $compile(el)(scope);
        }));

        it("should have called masonry", function() {
            expect(el.css('position')).toEqual('relative');
        });
    });

    describe('PhotoUploader', function() {
        beforeEach(inject(function($rootScope, $compile) {
            scope = $rootScope;
            el = angular.element('<photo-uploader></photo-uploader>');
            $compile(el)(scope);
            scope.$digest();
        }));
    });

    describe('PhotoModal', function() {
        var comments, httpBackend;
        beforeEach(inject(function($rootScope, $compile, $httpBackend) {
            comments = [
                {
                    "body": "ciao bello",
                    "userId": "daniel-pyrathon",
                    "date_added": "2013-01-13T19:51:10.780Z"
                },
                {
                    "body": "ciao bello2",
                    "userId": "daniel-pyrathon",
                    "date_added": "2013-01-13T19:51:10.780Z"
                }
            ];

            $httpBackend.whenPOST('photos/12345/comments').respond({
                body: 'Lorem Ipsum!',
                userId : 'daniel-pyrathon',
                date_added : new Date
            });
            httpBackend = $httpBackend;

            scope = $rootScope;
            el = angular.element('<photo-modal photo="selectedPhoto"/>');
            $compile(el)(scope);
            scope.$digest();
        }));

        it("Should be hidden if not selected photo", function() {
            expect(el.css('display')).toBe('none');
        });

        it("Should be visible if not selected photo", function() {
            scope.selectedPhoto = {};
            scope.$digest();
            expect(el.css('display')).toNotBe('none');
        });

        it("Should display all the comments related to the photo", function() {
            scope.selectedPhoto = {
                comments: comments
            };
            scope.$digest();
            expect(el.find('.comments li').length).toEqual(2);
        });

        it("Should be able to submit comments", function() {
            scope.selectedPhoto = {
                _id: '12345',
                comments: comments
            };
            scope.$digest();
            el.find('input[type="text"]').val("Lorem Ipsum!");
            el.find('form').submit();
            httpBackend.flush()
            expect(el.find('.comments li').length).toEqual(3);
        });
    })
});

describe('Services', function() {
    var utils;

    beforeEach(module('nikoInLondon.directives'))
    beforeEach(inject(function(DOMUtils) {
        utils = DOMUtils;
    }));

    it("Should clear overlay box", function() {
        var el = $('<div><div class="modal-backdrop"></div></div>');
        utils.flushModalBackdropFlusher(el);
        expect(el.find('.modal-backdrop').length).toEqual(0);
    });

});

describe('Filters', function() {
    var compile, scope;

    beforeEach(module('nikoInLondon.filters'));
    beforeEach(inject(function($compile, $rootScope) {
        compile = $compile;
        scope = $rootScope;
    }));

    it("Should be able to truncate", function() {
        var el = angular.element('<p>{{ value|truncate }}</p>');

        scope.value = "Hello";
        compile(el)(scope)
        scope.$digest();
        expect(el.text()).toEqual('Hello');

        scope.value = "helloworld123";
        compile(el)(scope)
        scope.$digest();
        expect(el.text()).toEqual('hellowo...');
    });
});

describe('Controllers', function() {

    var controller, scope, q;

    var e = {
        dataTransfer: {
            files: [
                true
            ]
        }
    };

    beforeEach(module('nikoInLondon.controllers'))
    beforeEach(inject(function($controller, $rootScope, $q) {
        scope = $rootScope.$new()
        controller = $controller;
        q = $q;
    }));

    it('should be able to change status from idle to loading', function() {
        var ctrl = controller('PhotoUploaderController', {$scope: scope});
        expect(scope.status).toEqual('idle');
        scope.onDropHandler(e);
        expect(scope.status).toEqual('loading');
    });

    it('should go back to idle on error', function() {
        var ctrl = controller('PhotoUploaderController', {$scope: scope});
        scope.onDropHandler({});
        expect(scope.status).toEqual('idle');
    });

    it('should return a correct object', function(done) {
        var ctrl = controller('PhotoUploaderController', {$scope: scope});
        var photo = scope.initializePhoto({
            name: 'hello_world.jpeg',
            data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQA',
            type: 'image/jpeg'
        });
        expect(photo.type == 'image/jpeg');
        expect(photo.title == 'hello_world');
        expect(photo.data == 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQA');
    });

});
