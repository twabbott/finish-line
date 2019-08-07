using FinishLineApi;
using FinishLineApi.Services;
using FinishLineApi.Store.Contexts;
using FinishLineApi.Store.Entities;
using Moq;
using System;
using System.Linq;
using System.Collections.Generic;
using System.Text;
using Xunit;
using FluentAssertions;
using FinishLineApi.Dto;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using FinishLineApi.DTO.Validators;

namespace ServiceTests
{
    public class LogEntriesServiceTests
    {
        int _nextId = 1000;
        Mock<ILogger<FinishLineDBContext>> _mockLogger = new Mock<ILogger<FinishLineDBContext>>();
        Mock<IHostingEnvironment> _mockHostingEnvironment = new Mock<IHostingEnvironment>();

        List<LogEntry> _testData = new List<LogEntry>
        {
        };

        public IFinishLineDBContext BuildDbContext()
        {
            // Build in-memory db context.  Need to add the Microsoft.EntityFrameworkCore.InMemory NuGet package.
            var options = new DbContextOptionsBuilder<FinishLineDBContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            IFinishLineDBContext context = new FinishLineDBContext(
                options,
                _mockLogger.Object,
                _mockHostingEnvironment.Object);
            context.LogEntries.Add(new LogEntry()
            {
                Id = 1000,
                Title = "I did this",
                Content = "No issues found",
                CreatedDate = new DateTime(2019, 07, 15, 12, 30, 0)
            });
            context.LogEntries.Add(new LogEntry()
            {
                Id = 1001,
                Title = "I did another thing",
                Content = "Went all right, mostly.  I guess.",
                CreatedDate = new DateTime(2019, 07, 16, 12, 30, 0)
            });
            context.CommitChanges();

            return context;
        }

        public LogEntriesService BuildService(IFinishLineDBContext context)
        {
            LogEntriesService service = new LogEntriesService(context, AutoMapperProfile.MapperFactory());

            return service;
        }

        [Fact]
        public void ReadAll_HappyPath()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                IEnumerable<LogEntryDto> result = service.ReadAllItems(null);

                result
                    .Should()
                        .NotBeNull()
                    .And
                        .HaveCount(2);
            }
        }

        [Fact]
        public void ReadAll_HappyPath_WithDate()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                IEnumerable<LogEntryDto> result = service.ReadAllItems(new DateTime(2019, 07, 15, 12, 30, 0));

                result
                    .Should()
                        .NotBeNull()
                    .And
                        .HaveCount(1);
            }
        }

        [Fact]
        public void ReadAll_NoResultsForDate()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                IEnumerable<LogEntryDto> result = service.ReadAllItems(new DateTime(2000, 01, 01, 12, 00, 00));

                result
                    .Should()
                        .NotBeNull()
                    .And
                        .HaveCount(0);
            }
        }

        [Fact]
        public void ReadItem_HappyPath()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto result = service.ReadItem(1001);

                result
                    .Should()
                    .NotBeNull();
            }
        }

        [Fact]
        public void ReadItem_NoResultForId()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto result = service.ReadItem(1234);

                result
                    .Should()
                    .BeNull();
            }
        }

        [Fact]
        public void CreateItem_HappyPath()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto result = null;
                try
                {
                    result = service.CreateItem(new LogEntryDto
                    {
                        Title = "I did this",
                        Content = "No issues found",
                    });
                }
                catch (Exception ex)
                {
                    throw;
                }

                result
                    .Should()
                    .NotBeNull();
                result.Id.Should().Equals(1002);
                result.CreatedDate.Day.Should().Equals(DateTime.Today.Day);
            }
        }

        [Fact]
        public void CreateItem_Error_TitleNull()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                var badItem = new LogEntryDto
                {
                    Title = null,
                    Content = "No issues found",
                };

                Exception ex = Assert.Throws<ContentValidationException>(() => service.CreateItem(badItem));
                ex.Message.Should().Equals("");
            }
        }

        [Fact]
        public void CreateItem_Error_TitleEmpty()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                var badItem = new LogEntryDto
                {
                    Title = "",
                    Content = "No issues found",
                };

                Exception ex = Assert.Throws<ContentValidationException>(() => service.CreateItem(badItem));
                ex.Message.Should().Equals("");
            }
        }

        [Fact]
        public void CreateItem_Error_TitleBlank()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                var badItem = new LogEntryDto
                {
                    Title = " ",
                    Content = "No issues found",
                };

                Exception ex = Assert.Throws<ContentValidationException>(() => service.CreateItem(badItem));
                ex.Message.Should().Equals("");
            }
        }
    }
}
