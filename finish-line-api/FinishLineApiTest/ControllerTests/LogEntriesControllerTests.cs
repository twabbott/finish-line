using FinishLineApi.Controllers;
using FinishLineApi.Dto;
using FinishLineApi.Services;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using FinishLineApi.DTO.Validators;

namespace ControllerTests
{
    public class LogEntriesControllerTests
    {
        int _nextId = 1000;
        Mock<ILogEntriesService> _mockLogEntriesService = new Mock<ILogEntriesService>();
        Mock<ILogger<LogEntriesController>> _mockLogger = new Mock<ILogger<LogEntriesController>>();

        List<LogEntryDto> _testData = new List<LogEntryDto>
        {
            new LogEntryDto()
            {
                Id = 1000,
                Title = "I did this",
                Content = "No issues found",
                CreatedDate = new DateTime(2019, 07, 15, 12, 30, 0)
            },
            new LogEntryDto()
            {
                Id = 1001,
                Title = "I did another thing",
                Content = "Went all right, mostly.  I guess.",
                CreatedDate = new DateTime(2019, 07, 16, 12, 30, 0)
            }
        };

        public LogEntriesController BuildController()
        {
            _mockLogEntriesService
                .Setup(inst => inst.ReadAllItems(It.IsAny<DateTime?>()))
                .Returns((DateTime? date) => date == null ? _testData.ToArray() : _testData.Where(item => item.CreatedDate == date).ToArray());
            _mockLogEntriesService
                .Setup(inst => inst.ReadItem(It.IsAny<int>()))
                .Returns((int id) => _testData.Where(item => item.Id == id).SingleOrDefault());
            _mockLogEntriesService
                .Setup(inst => inst.CreateItem(It.IsAny<LogEntryDto>()))
                .Returns((LogEntryDto newLogEntry) =>
                {
                    newLogEntry.Id = _nextId++;
                    newLogEntry.CreatedDate = DateTime.Now;
                    return newLogEntry;
                });
            _mockLogEntriesService
                .Setup(inst => inst.UpdateItem(It.IsAny<LogEntryDto>()))
                .Returns((LogEntryDto entry) =>
                {
                    var match = _testData.FirstOrDefault(item => item.Id == entry.Id);
                    if (match == null)
                    {
                        throw new NotFoundException("Not found");
                    }

                    match.Title = entry.Title;
                    match.Content = entry.Content;

                    return entry;
                });
            _mockLogEntriesService
                .Setup(inst => inst.DeleteItem(It.IsAny<int>()))
                .Callback((int id) =>
                {
                    var match = _testData.FirstOrDefault(item => item.Id == id);
                    if (match == null)
                    {
                        throw new NotFoundException("Not found");
                    }

                    _testData = _testData.Where(item => item.Id != id).ToList();
                });

            return new LogEntriesController(_mockLogEntriesService.Object, _mockLogger.Object);
        }

        [Fact]
        public void GetAll_HappyPath()
        {
            // Arrange
            var controller = BuildController();

            // Act
            var response = controller.GetAll(null);

            // Assert
            response.Result.Should().BeOfType<OkObjectResult>("Return a 200 OK response object, with content");

            var result = response.Result as OkObjectResult;
            result.Value.Should().BeOfType<LogEntryDto[]>("Content should be of type LogEntryDto[]");

            var items = result.Value as LogEntryDto[];
            items.Should().HaveCount(2, "Should have returned two items.");
        }

        [Fact]
        public void GetAll_SpecificDate()
        {
            // Arrange
            var controller = BuildController();

            // Act
            var response = controller.GetAll(new DateTime(2019, 07, 16, 12, 30, 0));

            // Assert
            response.Result.Should().BeOfType<OkObjectResult>("Return a 200 OK response object, with content");

            var result = response.Result as OkObjectResult;
            result.Value.Should().BeOfType<LogEntryDto[]>("Content should be of type LogEntryDto[]");

            var items = result.Value as LogEntryDto[];
            items.Should().HaveCount(1, "Should have  returned one item.");
        }

        [Fact]
        public void GetAll_Handles500()
        {
            // Arrange
            LogEntriesController controller = BuildController();
            _mockLogEntriesService
                .Setup(inst => inst.ReadAllItems(It.IsAny<DateTime?>()))
                .Throws(new Exception("Yeeeet!"));

            // Act
            var response = controller.GetAll(null);

            // Assert
            response.Result.Should().BeOfType<StatusCodeResult>("Return a 500 response object");

            var result = response.Result as StatusCodeResult;
            result.StatusCode.Should().Be(500);
        }

        [Fact]
        public void Get_HappyPath()
        {
            // Arrange
            var controller = BuildController();

            // Act
            var response = controller.Get(1000);

            // Assert
            response.Result.Should().BeOfType<OkObjectResult>("Return a 200 OK response object, with content");

            var result = response.Result as OkObjectResult;
            result.Value.Should().BeOfType<LogEntryDto>("Content should be of type LogEntryDto");

            var item = result.Value as LogEntryDto;
            item.Id.Should().Be(1000);
        }

        [Fact]
        public void Get_NotFound()
        {
            // Arrange
            var controller = BuildController();

            // Act
            var response = controller.Get(999);

            // Assert
            response.Result.Should().BeOfType<NotFoundResult>("Return a 404 response object");

            var result = response.Result as NotFoundResult;
            result.StatusCode.Should().Be(404);
        }

        [Fact]
        public void Get_Handles500()
        {
            // Arrange
            var controller = BuildController();
            _mockLogEntriesService
                .Setup(inst => inst.ReadItem(It.IsAny<int>()))
                .Throws(new Exception("Yeeeet!"));

            // Act
            var response = controller.Get(1000);

            // Assert
            response.Result.Should().BeOfType<StatusCodeResult>("Return a 500 response object");

            var result = response.Result as StatusCodeResult;
            result.StatusCode.Should().Be(500);
        }

        [Fact]
        public void Post_HappyPath()
        {
            // Arrange
            var testTitle = "I did this";
            var controller = BuildController();

            // Act
            LogEntryDto entry = new LogEntryDto
            {
                Title = testTitle,
                Content = "Because it was hard"
            };
            var response = controller.Create(entry);

            // Assert
            response.Result.Should().BeOfType<CreatedAtActionResult>("Return a 200 OK response object, with content");

            var result = response.Result as CreatedAtActionResult;
            result.Value.Should().BeOfType<LogEntryDto>("Content should be of type LogEntryDto");

            var item = result.Value as LogEntryDto;
            item.Id.Should().Be(1000);
            item.CreatedDate.Should().BeSameDateAs(DateTime.Today);
            item.Title.Should().Be(testTitle);
        }

        [Fact]
        public void Post_ContentValidationFailure()
        {
            // Arrange
            var controller = BuildController();
            _mockLogEntriesService
                .Setup(inst => inst.CreateItem(It.IsAny<LogEntryDto>()))
                .Throws(new ContentValidationException("Yeeeet!"));

            // Act
            LogEntryDto entry = new LogEntryDto
            {
                Title = "I did this",
                Content = null
            };
            var response = controller.Create(entry);

            // Assert
            response.Result.Should().BeOfType<BadRequestObjectResult>("Return a 400 result");
        }

        [Fact]
        public void Post_Handles500()
        {
            // Arrange
            var controller = BuildController();
            _mockLogEntriesService
                .Setup(inst => inst.CreateItem(It.IsAny<LogEntryDto>()))
                .Throws(new Exception("Yeeeet!"));

            // Act
            LogEntryDto entry = new LogEntryDto
            {
                Title = "I did this",
                Content = "Because it was hard"
            };
            var response = controller.Create(entry);

            // Assert
            response.Result.Should().BeOfType<StatusCodeResult>("Return a 500 response object");

            var result = response.Result as StatusCodeResult;
            result.StatusCode.Should().Be(500);
        }

        [Fact]
        public void Put_HappyPath()
        {
            // Arrange
            var testId = 1001;
            var testTitle = "New title";
            var testContent = "New content";
            var controller = BuildController();

            // Act
            LogEntryDto entry = new LogEntryDto
            {
                Id = testId,
                Title = testTitle,
                Content = testContent
            };
            var response = controller.Update(testId, entry);

            // Assert
            response.Result.Should().BeOfType<OkObjectResult>("Return a 200 OK response object, with content");

            var result = response.Result as OkObjectResult;
            result.Value.Should().BeOfType<LogEntryDto>("Content should be of type LogEntryDto");

            var item = result.Value as LogEntryDto;
            item.Id.Should().Be(testId);
            item.Title.Should().Be(testTitle);
            item.Content.Should().Be(testContent);
        }

        [Fact]
        public void Put_NotFound()
        {
            // Arrange
            var testId = 999;
            var testTitle = "New title";
            var testContent = "New content";
            var controller = BuildController();

            // Act
            LogEntryDto entry = new LogEntryDto
            {
                Id = testId,
                Title = testTitle,
                Content = testContent
            };
            var response = controller.Update(testId, entry);

            // Assert
            response.Result.Should().BeOfType<NotFoundObjectResult>("Return a 404 result");

            var result = response.Result as NotFoundObjectResult;
            result.StatusCode.Should().Be(404);
        }

        [Fact]
        public void Put_UrlIdMismatch()
        {
            // Arrange
            var testId = 1001;
            var testTitle = "New title";
            var testContent = "New content";
            var controller = BuildController();

            // Act
            LogEntryDto entry = new LogEntryDto
            {
                Id = testId,
                Title = testTitle,
                Content = testContent
            };
            var response = controller.Update(999, entry);

            // Assert
            response.Result.Should().BeOfType<BadRequestObjectResult>("Return a 400 result");
        }

        [Fact]
        public void Put_ContentValidationFailure()
        {
            // Arrange
            int testId = 1000;
            var controller = BuildController();
            _mockLogEntriesService
                .Setup(inst => inst.UpdateItem(It.IsAny<LogEntryDto>()))
                .Throws(new ContentValidationException("Yeeeet!"));

            // Act
            LogEntryDto entry = new LogEntryDto
            {
                Id = testId,
                Title = "I did this",
                Content = null
            };
            var response = controller.Update(testId, entry);

            // Assert
            response.Result.Should().BeOfType<BadRequestObjectResult>("Return a 400 result");
        }

        [Fact]
        public void Put_Handles500()
        {
            // Arrange
            var controller = BuildController();
            _mockLogEntriesService
                .Setup(inst => inst.UpdateItem(It.IsAny<LogEntryDto>()))
                .Throws(new Exception("Yeeeet!"));

            // Act
            LogEntryDto entry = new LogEntryDto
            {
                Id = 1000,
                Title = "I did this",
                Content = "Because it was hard"
            };
            var response = controller.Update(1000, entry);

            // Assert
            response.Result.Should().BeOfType<StatusCodeResult>("Return a 500 response object");

            var result = response.Result as StatusCodeResult;
            result.StatusCode.Should().Be(500);
        }

        [Fact]
        public void Delete_HappyPath()
        {
            // Arrange
            var controller = BuildController();

            // Act
            var response = controller.Delete(1000);

            // Assert
            response.Should().BeOfType<NoContentResult>("Return a 204 response object");
        }

        [Fact]
        public void Delete_NotFound()
        {
            // Arrange
            var testId = 999;
            var controller = BuildController();

            // Act
            var response = controller.Delete(testId);

            // Assert
            response.Should().BeOfType<NotFoundObjectResult>("Return a 404 result");

            var result = response as NotFoundObjectResult;
            result.StatusCode.Should().Be(404);
        }

        [Fact]
        public void Delete_Handles500()
        {
            // Arrange
            var testId = 999;
            var controller = BuildController();
            _mockLogEntriesService
                .Setup(inst => inst.DeleteItem(It.IsAny<int>()))
                .Throws(new Exception("Yeeeet!"));

            // Act
            var response = controller.Delete(testId);

            // Assert
            response.Should().BeOfType<StatusCodeResult>("Return a 500 response object");

            var result = response as StatusCodeResult;
            result.StatusCode.Should().Be(500);
        }
    }
}
