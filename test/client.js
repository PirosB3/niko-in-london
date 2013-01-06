describe('Niko In London', function() {

    var httpBackend;
    beforeEach(module('nikoInLondon.services'));
    beforeEach(inject(function($httpBackend) {
        httpBackend = $httpBackend;
        httpBackend.whenGET('photos').respond([
            {
                "comments": [],
                "date_added": "2013-01-02T20:11:00.396Z",
                "title": "Sow B3",
                "path": "https://niko-in-london-testing.s3.amazonaws.com/images/A_3.JPG?Expires=1357246904&AWSAccessKeyId=AKIAJVXDGWZHB4W25BNQ&Signature=EklACjwuw76VTvU%2BRrOdmfgcPO8%3D",
                "_id": "50e49454471aaa4f4a000003"
            },
            {
                "comments": [{
                    "body": "bella questa foto!",
                    "userId": "daniel-pyrathon",
                    "date_added": "2013-01-03T00:49:46.027Z"
                }],
                "date_added": "2013-01-02T20:11:00.396Z",
                "title": "Lorem Ipsum",
                "path": "https://niko-in-london-testing.s3.amazonaws.com/images/A_3.JPG?Expires=1357246904&AWSAccessKeyId=AKIAJVXDGWZHB4W25BNQ&Signature=EklACjwuw76VTvU%2BRrOdmfgcPO8%3D",
                "_id": "50e49454471aaa4f4a000004"
            }
        ]);
        httpBackend.whenPOST('photos/50e48d59471aaa4f4a000002/comments').respond({
            body: 'your nice!',
            userId : 'daniel-pyrathon',
            date_added : new Date
        });
    }));
    describe('Niko In London List View Controller', function() {

        var scope, controller;
        beforeEach(inject(function($rootScope, $controller, $httpBackend) {
            scope = $rootScope.$new();
            controller = $controller;
        }));

        it('should create a photos model with 2 photos', function() {
            ctrl = controller(MainController, {$scope: scope});
            httpBackend.flush()
            expect(scope.photos.length).toEqual(2);
        });

        it('should be able to create comment childrnen', function() {
            inject(function(Comment) {
                var c = new Comment({
                    body: 'your nice!'
                });
                c.$save( {photoId : '50e48d59471aaa4f4a000002'} );
                httpBackend.flush();
                expect(c.date_added).toBeTruthy();
            });
        });

        it('should change the title', function() {
            ctrl = controller(MainController, {$scope: scope});
            expect(scope.selectedPhoto).toBeFalsy();
            inject(function($window) {
                expect($window.document.title).toEqual('Niko In London | All Photos');
            });
        });

        it('should build the title based on the selected photo', function() {
            ctrl = controller(MainController, {$scope: scope, $routeParams : {
                photo: {
                    title: 'Lorem Ipsum'
                }
            }});
            inject(function($window, Comment) {
                expect(scope.selectedPhoto).toBeTruthy();
                expect(scope.newComment instanceof Comment).toBeTruthy();
                expect($window.document.title).toEqual('Niko In London | Lorem Ipsum');
            });
        });

        it('should create a new comment on new comment submitted', function() {
            inject(function(Photo) {
                ctrl = controller(MainController, {$scope: scope, $routeParams : {
                    photo: {
                        _id: '50e48d59471aaa4f4a000002',
                        comments : []
                    }
                }});
                scope.newComment.body = 'Hello World!!';
                scope.submitNewComment();
                httpBackend.flush();
                expect(scope.selectedPhoto.comments.length).toEqual(1);
                expect(scope.selectedPhoto.comments[0].body).toEqual('your nice!');
                expect(scope.selectedPhoto.comments[0].date_added).toBeTruthy();
                expect(scope.newComment.body).toNotEqual('your nice!');
            });
        });
    });

});
