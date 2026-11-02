#!/usr/bin/env node

/**
 * Content validation test for nightdogs.xyz
 * Validates post frontmatter and content structure using existing Zod dependency
 */

import { z } from 'zod';
import matter from 'gray-matter';
import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import authorsData from '../_data/authors.json' with { type: 'json' };

const validAuthors = Object.keys(authorsData);

// Matches what the CMS writes (public/admin/config.yml). The `posts` tag is
// added automatically by content/blog/blog.11tydata.js, so it's optional here.
const PostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  author: z.enum(validAuthors, { message: "Invalid author" }),
  date: z.coerce.date({ message: "Invalid date" }),
  draft: z.boolean().optional(),
  photoLayout: z.enum(["column", "grid"]).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  collaborators: z.array(z.enum(validAuthors)).optional(),
  series: z.string().optional(),
  seriesPart: z.number().optional(),
  featuredImage: z.string().optional(),
  featuredImageAlt: z.string().optional(),
  excerpt: z.string().optional()
});

export async function validateAllPosts() {
  console.log('📝 Validating all blog posts...');

  try {
    const posts = await glob('content/blog/**/index.md');
    console.log(`   Found ${posts.length} posts to validate`);

    let errors = 0;
    const errorDetails = [];

    for (const postPath of posts) {
      try {
        const content = fs.readFileSync(postPath, 'utf8');
        const { data, content: markdownContent } = matter(content);

        // Validate frontmatter structure
        PostSchema.parse(data);

        // Additional validations
        const issues = [];
        const warnings = [];

        // Check if post has content
        const hasImage = /!\[[^\]]*\]\(|<img\b/i.test(markdownContent || "");
        if (!hasImage && (!markdownContent || markdownContent.trim().length < 20)) {
          issues.push("Post is empty");
        }

        // Check if author folder matches frontmatter
        const pathParts = postPath.split('/');
        const authorFromPath = pathParts[2]; // content/blog/{author}/...
        if (data.author !== authorFromPath) {
          issues.push(`Author mismatch: path says ${authorFromPath}, frontmatter says ${data.author}`);
        }

        // Check if date folder matches frontmatter
        const dateFromPath = pathParts[3]; // content/blog/author/{date}/...
        // The CMS names folders in UTC while dates keep the author's time
        // zone, so allow a one-day difference.
        const frontmatterDate = new Date(data.date);
        const folderDate = new Date(`${dateFromPath}T12:00:00Z`);
        const daysApart = Math.abs(frontmatterDate - folderDate) / 86400000;
        if (Number.isNaN(folderDate.getTime())) {
          warnings.push(`Folder ${dateFromPath} isn't a YYYY-MM-DD date`);
        } else if (daysApart > 1.5) {
          warnings.push(`Date folder ${dateFromPath} doesn't match date ${frontmatterDate.toISOString().slice(0, 10)}`);
        }

        // Check if featured image exists
        if (data.featuredImage) {
          const imagePath = path.join(path.dirname(postPath), data.featuredImage);
          if (!fs.existsSync(imagePath)) {
            issues.push(`Featured image not found: ${data.featuredImage}`);
          }
        }

        // Check if collaborators are different from main author
        if (data.collaborators) {
          if (data.collaborators.includes(data.author)) {
            issues.push("Author listed in collaborators");
          }
        }

        // Check series consistency
        if (data.series && !data.seriesPart) {
          issues.push("Series specified but missing part number");
        }
        if (data.seriesPart && !data.series) {
          issues.push("Series part specified but missing series name");
        }

        warnings.forEach(warning => console.log(`   ℹ️  ${postPath}: ${warning}`));

        if (issues.length > 0) {
          errors++;
          errorDetails.push({
            post: postPath,
            issues: issues
          });
          console.log(`   ⚠️  ${postPath}: ${issues.length} issue(s)`);
          issues.forEach(issue => console.log(`      - ${issue}`));
        } else {
          console.log(`   ✅ ${postPath}`);
        }

      } catch (error) {
        errors++;
        errorDetails.push({
          post: postPath,
          issues: [error.message]
        });
        console.log(`   ❌ ${postPath}: ${error.message}`);
      }
    }

    if (errors === 0) {
      console.log('✅ All posts validated successfully');
      return true;
    } else {
      console.log(`❌ Found issues in ${errors} post(s)`);
      return false;
    }

  } catch (error) {
    console.error('❌ Content validation failed:', error.message);
    return false;
  }
}

export async function validateAuthorsData() {
  console.log('👥 Validating authors data...');

  try {
    // Check that all authors have required fields
    const requiredFields = ['name', 'theme'];
    let errors = 0;

    for (const [authorKey, authorData] of Object.entries(authorsData)) {
      const issues = [];

      requiredFields.forEach(field => {
        if (!authorData[field]) {
          issues.push(`Missing required field: ${field}`);
        }
      });

      // Validate theme structure
      if (authorData.theme) {
        if (!authorData.theme.light || !authorData.theme.dark) {
          issues.push("Theme missing light or dark mode");
        }

        const requiredThemeFields = ['background', 'color', 'primary'];
        ['light', 'dark'].forEach(mode => {
          if (authorData.theme[mode]) {
            requiredThemeFields.forEach(field => {
              if (!authorData.theme[mode][field]) {
                issues.push(`Theme ${mode} mode missing ${field}`);
              }
            });
          }
        });
      }

      if (issues.length > 0) {
        errors++;
        console.log(`   ❌ ${authorKey}: ${issues.join(', ')}`);
      } else {
        console.log(`   ✅ ${authorKey}`);
      }
    }

    return errors === 0;

  } catch (error) {
    console.error('❌ Authors validation failed:', error.message);
    return false;
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const results = await Promise.all([
    validateAllPosts(),
    validateAuthorsData()
  ]);

  const success = results.every(result => result);
  process.exit(success ? 0 : 1);
}
