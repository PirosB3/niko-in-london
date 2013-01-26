describe('Directives', function() {
    var el, scope;

    beforeEach(module('nikoInLondon.directives'));
    beforeEach(module('public/views/photo-modal.html', 'public/views/photo-single.html'));

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
            scope.$digest();
        }));

        it("should have called masonry", function() {
            expect(el.css('position')).toEqual('relative');
        });
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
            var s = el.scope();
            el.find('input[type="text"]').val("Lorem Ipsum!");
            el.find('form').submit();
            httpBackend.flush()
            expect(el.find('.comments li').length).toEqual(3);
        });

    });

});
