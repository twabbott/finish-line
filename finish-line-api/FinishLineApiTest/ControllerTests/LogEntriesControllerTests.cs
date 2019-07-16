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

namespace ControllerTests
{
    public class LogEntriesControllerTests
    {
        Mock<ILogEntriesService> _mockLogEntriesService = new Mock<ILogEntriesService>();
        Mock<ILogger<LogEntriesController>> _mockLogger = new Mock<ILogger<LogEntriesController>>();

        static readonly List<LogEntryDto> _testData = new List<LogEntryDto>
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
                .Setup(instance => instance.ReadAllItems(It.IsAny<DateTime?>()))
                .Returns((DateTime? date) => date == null ? _testData.ToArray() : _testData.Where(item => item.CreatedDate == date).ToArray());
            _mockLogEntriesService
                .Setup(inst => inst.ReadItem(It.IsAny<int>()))
                .Returns((int id) => _testData.Where(item => item.Id == id).SingleOrDefault());

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
                .Setup(instance => instance.ReadAllItems(It.IsAny<DateTime?>()))
                .Throws(new Exception("Yeeeet!"));

            // Act
            var response = controller.GetAll(null);

            // Assert
            response.Result.Should().BeOfType<StatusCodeResult>("Return a 500 response object");

            var result = response.Result as StatusCodeResult;
            result.StatusCode.Should().Equals(500);
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
            result.Value.Should().BeOfType<LogEntryDto>("Content should be of type LogEntryDto[]");

            var item = result.Value as LogEntryDto;
            item.Id.Should().Equals(1000);
        }

        [Fact]
        public void Get_NotFound()
        {
            // Arrange
            var controller = BuildController();

            // Act
            var response = controller.Get(999);

            // Assert
            response.Result.Should().BeOfType<NotFoundResult>("Return a 500 response object");

            var result = response.Result as NotFoundResult;
            result.StatusCode.Should().Equals(404);
        }

        [Fact]
        public void Get_Handles500()
        {
            // Arrange
            var controller = BuildController();
            _mockLogEntriesService
                .Setup(instance => instance.ReadItem(It.IsAny<int>()))
                .Throws(new Exception("Yeeeet!"));

            // Act
            var response = controller.Get(1000);

            // Assert
            response.Result.Should().BeOfType<StatusCodeResult>("Return a 500 response object");

            var result = response.Result as StatusCodeResult;
            result.StatusCode.Should().Equals(500);
        }
    }
}
