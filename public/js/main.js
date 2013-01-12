angular.module('nikoInLondon.services', ['ngResource']).
    factory('photoService', function($resource, $q) {
        var cache = null;
        var photo = $resource('photos/:photoId', { photoId: '@_id'});
        return {
            Photo: photo,
            getPhotos: function() {
                var def = $q.defer();
                if (cache) {
                    def.resolve(cache);
                } else {
                    photo.query(function(res) {
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
    directive('photo', function() {
        return {
            restrict: 'E',
            templateUrl: 'photo-template.html',
            scope : {
                model: '='
            }
        }
    }).
    directive('photoDetail', function($location, Comment) {
        return {
            restrict: 'E',
            scope : {
                selectedPhoto: '='
            },
            link : function(scope, element, attrs) {
                scope.comment = new Comment;
                element.on('hidden', function() {
                    $location.path('/');
                    scope.$apply();
                });
                scope.addComment = function() {
                    scope.comment.$save({photoId: scope.selectedPhoto._id }, function(res) {
                        scope.selectedPhoto.comments.push(res);
                        scope.comment = new Comment;
                    });
                }
                scope.$watch('selectedPhoto', function(e) {
                    if (!e) {
                        element.modal('hide');
                    } else {
                        element.modal("show");
                    }
                });
            }
        }
    });

angular.module('nikoInLondon.controllers', ['nikoInLondon.services']).
    controller('MainController', function($scope, $window, $routeParams, photoService, Comment) {
        photoService.getPhotos().then(function(res) {
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

angular.module('nikoInLondon', ['nikoInLondon.controllers', 'nikoInLondon.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/main', {reloadOnSearch: false, templateUrl: 'views/main.html', controller: 'MainController'});
    $routeProvider.when('/pic/:photoId', {templateUrl: 'views/main.html', controller: 'MainController' });
    $routeProvider.otherwise({redirectTo: '/main'});
  }]);
