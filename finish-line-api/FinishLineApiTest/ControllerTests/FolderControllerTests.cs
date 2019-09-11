using FinishLineApi.Controllers;
using System;
using System.Collections.Generic;
using System.Text;
using Moq;
using FluentAssertions;
using FinishLineApi.DTO;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using Microsoft.Extensions.Logging;
using FinishLineApi.Services;
using System.Linq;

namespace ControllerTests
{
    public class FolderControllerTests
    {
        Mock<IFolderService> _mockFolderService = new Mock<IFolderService>();
        Mock<ILogger<FolderController>> _mockLogger = new Mock<ILogger<FolderController>>();

        int _nextId = 1010;
        List<FolderInfoDto> _testData = new List<FolderInfoDto> {
            new FolderInfoDto {
                Folder = null,
                Subfolders = new List<FolderDto>()
                {
                    new FolderDto()
                    {
                        Id = 1000,
                        Name = "Sprints"
                    },
                    new FolderDto()
                    {
                        Id = 1001,
                        Name = "Personal"
                    }
                },

                Projects = new List<ProjectDto>()
            },
            new FolderInfoDto
            {
                Folder = new FolderDto
                {
                    Id = 1000,
                    Name = "Sprints"
                },

                Subfolders = new List<FolderDto>()
                {
                    new FolderDto()
                    {
                        Id = 1002,
                        Name = "3.45"
                    },
                    new FolderDto()
                    {
                        Id = 1003,
                        Name = "3.46"
                    }
                },

                Projects = new List<ProjectDto>()
            },
            new FolderInfoDto
            {
                Folder = new FolderDto
                {
                    Id = 1001,
                    Name = "Personal"
                },

                Subfolders = new List<FolderDto>(),

                Projects = new List<ProjectDto>()
                {
                    new ProjectDto()
                    {
                        Id = 1002,
                        Title = "3.45"
                    },
                    new ProjectDto()
                    {
                        Id = 1003,
                        Title = "3.46"
                    }
                }
             }
        };

        public FolderController BuildController()
        {
            _mockFolderService
                .Setup(inst => inst.ReadItemAsync(It.IsAny<int?>()))
                .ReturnsAsync((int? id) =>
                {
                    FolderInfoDto item = null;
                    if (id == null)
                    {
                        item = _testData
                            .Where(folder => folder.Folder == null)
                            .SingleOrDefault();
                    }
                    else
                    {
                        item = _testData
                            .Where(folder => folder.Folder != null && folder.Folder.Id == id)
                            .SingleOrDefault();
                    }

                    return item;
                });
            _mockFolderService
                .Setup(inst => inst.CreateItemAsync(It.IsAny<FolderInfoDto>()))
                .ReturnsAsync((FolderInfoDto folderInfo) =>
                {
                    folderInfo.Folder.Id = _nextId++;
                    return folderInfo;
                });

            return new FolderController(_mockFolderService.Object, _mockLogger.Object);
        }

        [Fact]
        public async void GetRootFolder_HappyPath()
        {
            // Arrange
            var controller = BuildController();

            // Act
            var response = await controller.GetFolderInfoAsync(null);

            // Assert
            response.Result.Should().BeOfType<OkObjectResult>("Return a 200 OK response object, with content");

            var result = response.Result as OkObjectResult;
            result.Value.Should().BeOfType<FolderInfoDto>("Content should be of type FolderContentDto");

            var folderContent = result.Value as FolderInfoDto;
            folderContent.Folder.Should().BeNull();
            folderContent.Projects.Should().NotBeNull();
            folderContent.Projects.Count.Should().Be(0);
            folderContent.Subfolders.Should().NotBeNullOrEmpty();
            folderContent.Subfolders[0].Name.Should().Be("Sprints");
            folderContent.Subfolders[1].Name.Should().Be("Personal");
        }

        [Fact]
        public async void GetFolder_HappyPath()
        {
            // Arrange
            var controller = BuildController();

            // Act
            var response = await controller.GetFolderInfoAsync(1000);

            // Assert
            response.Result.Should().BeOfType<OkObjectResult>("Return a 200 OK response object, with content");

            var result = response.Result as OkObjectResult;
            result.Value.Should().BeOfType<FolderInfoDto>("Content should be of type FolderContentDto");

            var folderContent = result.Value as FolderInfoDto;
            folderContent.Folder.Should().NotBeNull();
            folderContent.Folder.Id.Should().Be(1000);
            folderContent.Folder.Name.Should().Be("Sprints");
            folderContent.Projects.Should().NotBeNull();
            folderContent.Projects.Count.Should().Be(0);
            folderContent.Subfolders.Should().NotBeNullOrEmpty();
            folderContent.Subfolders[0].Name.Should().Be("3.45");
            folderContent.Subfolders[1].Name.Should().Be("3.46");
        }

        [Fact]
        public async void GetFolder_NotFound()
        {
            // Arrange
            var controller = BuildController();

            // Act
            var response = await controller.GetFolderInfoAsync(89173);

            // Assert
            response.Result.Should().BeOfType<NotFoundResult>("Return a 404 response object");

            var result = response.Result as NotFoundResult;
            result.StatusCode.Should().Be(404);
        }

        [Fact]
        public async void GetFolder_Handles500()
        {
            // Arrange
            var controller = BuildController();
            _mockFolderService
                .Setup(inst => inst.ReadItemAsync(It.IsAny<int?>()))
                .Throws(new Exception("Yeeeet!"));

            // Act
            var response = await controller.GetFolderInfoAsync(-1);

            // Assert
            response.Result.Should().BeOfType<StatusCodeResult>("Return a 500 response object");

            var result = response.Result as StatusCodeResult;
            result.StatusCode.Should().Be(500);
        }

        [Fact]
        public async void Post_HappyPath()
        {
            // Arrange
            var nextId = _nextId;
            var controller = BuildController();

            // Act
            FolderInfoDto newFolder = new FolderInfoDto
            {
                Folder = new FolderDto
                {
                    Name = "New Folder"
                }
            };

            var response = await controller.CreateFolderAsync(newFolder);

            // Assert
            response.Result.Should().BeOfType<CreatedAtActionResult>("Return a 200 OK response object, with content");

            var result = response.Result as CreatedAtActionResult;
            result.Value.Should().BeOfType<FolderInfoDto>("Content should be of type FolderInfoDto");

            var item = result.Value as FolderInfoDto;
            item.Folder.Should().NotBeNull();
            item.Folder.Id.Should().Be(nextId);
            item.Folder.Name.Should().Be("New Folder");
        }

        /* TODO: Need to finish this out.  I don't really have a service layer yet, or a
         * repository.  I'm working top-down, and doing TDD more or less.
         * 
         */
    }
}
