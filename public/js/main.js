angular.module('nikoInLondon.services', ['ngResource']).
    factory('Photo', function($resource, $q) {
        var Photo = $resource('photos/:photoId', { photoId: '@_id'});
        var cache;
        return {
            getPhotos: function() {
                var def = $q.defer();
                if (cache) {
                    def.resolve(cache);
                } else {
                    Photo.query(function(res) {
                        cache = res;
                        def.resolve(cache);
                    });
                }
                return def.promise;
            }
        }
    }).
    factory('Comment', function($resource) {
        return $resource('photos/:photoId/comments', { photoId: 'photoId'});
    });

angular.module('nikoInLondon.directives', []).
    directive('photoGrid', function() {
        var linkFn = function(scope, element, attrs) {
            element.masonry({
                itemSelector: element.itemSelector,
                columnWidth: 240,
                animationOptions: {
                  duration: 400
                }
            });
        }
        return {
            restrict: 'E',
            link: linkFn,
            scope : {
                itemSelector: '='
            }
        }
    }).
    directive('photo', function() {
        return {
            template: '<div><img src="{{ model.path }}"></img></div>',
            replace : true,
            transclude: true,
            restrict: 'E',
            scope : {
                model: '='
            }
        }
    }).
    directive('photoModal', function(Comment) {
        return {
            restrict: 'E',
            scope: {
                selectedPhoto : '=model'
            },
            link: function(scope, el, attrs) {
                scope.submitComment = function() {
                    scope.comment.$save({ photoId: scope.selectedPhoto._id }, function(res){
                        scope.selectedPhoto.comments.push(res);
                        scope.comment = new Comment;
                    });
                }
                scope.$watch('selectedPhoto', function(e) {
                    if (!e) {
                        el.hide();
                    } else {
                        el.show();
                        scope.comment = new Comment;
                    }
                });
            }
        }
    });

angular.module('nikoInLondon.controllers', ['nikoInLondon.services']).
    controller('MainController', function($scope, $window, $routeParams, Photo, Comment) {
        Photo.getPhotos().then(function(res) {
            $scope.photos = res;
            if ($routeParams.photoId) {
                $scope.photos.forEach(function(el) {
                    if (el._id === $routeParams.photoId) $scope.selectedPhoto = el;
                });
                $scope.newComment = new Comment();
                $window.document.title = "Niko In London | " + $scope.selectedPhoto.title;
            }
        });
        $window.document.title = "Niko In London | All Photos";

        $scope.submitNewComment = function() {
            $scope.newComment.$save({ photoId : $scope.selectedPhoto._id }, function() {
                $scope.selectedPhoto.comments.push($scope.newComment);
                $scope.newComment = new Comment();
            });
        }
    });

angular.module('nikoInLondon', ['nikoInLondon.controllers', 'nikoInLondon.directives', 'nikoInLondon.services']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', { templateUrl: 'views/main.html', controller: 'MainController'});
    $routeProvider.when('/photos/:photoId', {templateUrl: 'views/main.html', controller: 'MainController' });
    $routeProvider.otherwise({redirectTo: '/'});
  }]);
