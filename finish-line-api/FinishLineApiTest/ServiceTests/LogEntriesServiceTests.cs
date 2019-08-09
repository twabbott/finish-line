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

        #region ### ReadAll ####################################################

        [Fact]
        public void ReadAll_HappyPath()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                IEnumerable<LogEntryDto> result = service.ReadAllItems(null);

                result.Should()
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

                result.Should()
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

                result.Should()
                    .NotBeNull()
                    .And
                    .HaveCount(0);
            }
        }

        #endregion

        #region ### ReadItem ###################################################

        [Fact]
        public void ReadItem_HappyPath()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto result = service.ReadItem(1001);

                result.Should().NotBeNull("Result should not be null");
                result.Title.Should().Be("I did another thing");
                result.Content.Should().Be("Went all right, mostly.  I guess.");
                result.CreatedDate.Year.Should().Be(2019);
            }
        }

        [Fact]
        public void ReadItem_NoResultForId()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto result = service.ReadItem(1234);

                result.Should().BeNull();
            }
        }

        #endregion

        #region ### CreateItem #################################################

        [Fact]
        public void CreateItem_HappyPath()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto result = service.CreateItem(new LogEntryDto
                {
                    Title = "I did this",
                    Content = "No issues found",
                });

                result.Should().NotBeNull();
                result.Id.Should().BeGreaterThan(0);
                result.Title.Should().Be("I did this");
                result.Content.Should().Be("No issues found");
                result.CreatedDate.Day.Should().Be(DateTime.Today.Day);
            }
        }

        [Fact]
        public void CreateItem_TrimWhitespace()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto result = service.CreateItem(new LogEntryDto
                {
                    Title = @" 
 I did this   ",
                    Content = @" No issues found   
",
                });

                result.Should().NotBeNull();
                result.Id.Should().BeGreaterThan(0);
                result.Title.Should().Be("I did this");
                result.Content.Should().Be("No issues found");
                result.CreatedDate.Day.Should().Be(DateTime.Today.Day);
            }
        }

        [Fact]
        public void CreateItem_NullContent()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto result = service.CreateItem(new LogEntryDto
                {
                    Title = "I did this",
                    Content = null,
                });

                result.Should().NotBeNull();
                result.Id.Should().BeGreaterThan(0);
                result.Title.Should().Be("I did this");
                result.Content.Should().Be("");
                result.CreatedDate.Day.Should().Be(DateTime.Today.Day);
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

                Action act = () => service.CreateItem(badItem);
                act.Should()
                    .Throw<ContentValidationException>();
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

                Action act = () => service.CreateItem(badItem);
                act.Should()
                    .Throw<ContentValidationException>();
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

                Action act = () => service.CreateItem(badItem);
                act.Should()
                    .Throw<ContentValidationException>();
            }
        }

        #endregion

        #region ### UpdateItem #################################################
        
        [Fact]
        public void UpdateItem_HappyPath()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto result = service.UpdateItem(new LogEntryDto
                {
                    Id = 1001,
                    Title = "Changed",
                    Content = "Changed"
                });

                result.Should().NotBeNull();
                result.Id.Should().Be(1001);
                result.Title.Should().Be("Changed");
                result.Content.Should().Be("Changed");
                result.CreatedDate.Year.Should().Be(2019);
            }
        }

        [Fact]
        public void UpdateItem_TrimWhitespace()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto result = service.UpdateItem(new LogEntryDto
                {
                    Id = 1001,
                    Title = @" 
 Changed   ",
                    Content = @" Changed   
",
                });

                result.Should().NotBeNull();
                result.Id.Should().Be(1001);
                result.Title.Should().Be("Changed");
                result.Content.Should().Be("Changed");
                result.CreatedDate.Year.Should().Be(2019);
            }
        }

        [Fact]
        public void UpdateItem_Error_ContentNull()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto result = service.UpdateItem(new LogEntryDto
                {
                    Id = 1001,
                    Title = "Changed",
                    Content = null
                });

                result.Should().NotBeNull();
                result.Id.Should().Be(1001);
                result.Title.Should().Be("Changed");
                result.Content.Should().Be("");
                result.CreatedDate.Year.Should().Be(2019);
            }
        }

        [Fact]
        public void UpdateItem_Error_NotFound()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto badItem = new LogEntryDto
                {
                    Id = 999999,
                    Title = "Changed",
                    Content = "Changed"
                };

                Action act = () => service.UpdateItem(badItem);
                act.Should()
                    .Throw<NotFoundException>()
                    .WithMessage("Item with id=999999 not found.");
            }
        }

        [Fact]
        public void UpdateItem_Error_TitleNull()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto badItem = new LogEntryDto
                {
                    Id = 1001,
                    Title = null,
                    Content = "Changed"
                };

                Action act = () => service.UpdateItem(badItem);
                act.Should()
                    .Throw<ContentValidationException>()
                    .WithMessage("'Title' must not be empty.");
            }
        }

        [Fact]
        public void UpdateItem_Error_TitleEmpty()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto badItem = new LogEntryDto
                {
                    Id = 1001,
                    Title = "",
                    Content = "Changed"
                };

                Action act = () => service.UpdateItem(badItem);
                act.Should()
                    .Throw<ContentValidationException>()
                    .WithMessage("'Title' must not be empty.");
            }
        }

        [Fact]
        public void UpdateItem_Error_TitleBlank()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                LogEntryDto badItem = new LogEntryDto
                {
                    Id = 1001,
                    Title = "   ",
                    Content = "Changed"
                };

                Action act = () => service.UpdateItem(badItem);
                act.Should()
                    .Throw<ContentValidationException>()
                    .WithMessage("'Title' must not be empty.");
            }
        }

        #endregion

        #region ### DeleteItem #################################################

        [Fact]
        public void DeleteItem_HappyPath()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                int count1 = service.ReadAllItems().Count();
                service.DeleteItem(1001);
                int count2 = service.ReadAllItems().Count();

                count2.Should().Be(count1 - 1);
            }
        }

        [Fact]
        public void DeleteItem_Error_NotFound()
        {
            using (var context = BuildDbContext())
            {
                var service = BuildService(context);

                Action act = () => service.DeleteItem(999999);
                act.Should()
                    .Throw<NotFoundException>()
                    .WithMessage("Item with id=999999 not found.");
            }
        }

        #endregion
    }
}
