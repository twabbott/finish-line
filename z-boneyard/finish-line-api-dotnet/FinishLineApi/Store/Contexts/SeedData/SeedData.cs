using System;
using System.Linq;

using FinishLineApi.Store.Contexts;
using FinishLineApi.Store.Entities;

namespace FinishLineApi.Models
{
    public static class SeedData
    {
        public static void CreateSeedData(this IFinishLineDBContext dbContext)
        {
            dbContext.SeedWorkNote();
            dbContext.SaveChanges();
        }

        private static void SeedWorkNote(this IFinishLineDBContext dbContext)
        {
            int count = dbContext.WorkNotes.Count();
            if (count > 0)
            {
                return;
            }

            dbContext.WorkNotes.Add(new WorkNote
            {
                Title = "Bathe the cat",
                Content = "Stinky cat!  Now she's clean.  Only two stitches this time.  She's good for another year!",
                CreatedDate = DateTime.Today + TimeSpan.FromHours(9)
            });
            dbContext.WorkNotes.Add(new WorkNote
            {
                Title = "Organize my CDs",
                Content = "My wife's been on me to do this.  Haven't touched these since college.  Done, and done!",
                CreatedDate = DateTime.Today + TimeSpan.FromHours(10)
            });
            dbContext.WorkNotes.Add(new WorkNote
            {
                Title = "StarCraft tournament",
                Content = "I really suck at this.  Too bad I like it!",
                CreatedDate = DateTime.Today + TimeSpan.FromHours(11)
            });
        }
    }
}
